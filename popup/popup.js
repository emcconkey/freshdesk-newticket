document.addEventListener('DOMContentLoaded', function () {
    // Main form elements
    const apiForm = document.getElementById('apiForm');
    const subjectInput = document.getElementById('subject');
    const descriptionInput = document.getElementById('description');
    const workNoteInput = document.getElementById('workNote');
    const privateNoteCheckbox = document.getElementById('privateNote');
    const companySelect = document.getElementById('company');
    const contactSelect = document.getElementById('contact');
    const emailNotificationSelect = document.getElementById('emailNotification');
    const timeSpentInput = document.getElementById('timeSpent');
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const backBtn = document.getElementById('backBtn');
    const mainView = document.getElementById('mainView');
    const settingsView = document.getElementById('settingsView');
    const settingsForm = document.getElementById('settingsForm');
    const apiKeyInput = document.getElementById('apiKey');
    const domainInput = document.getElementById('domain');
    const agentIdInput = document.getElementById('agentId');
    const settingsResultDiv = document.getElementById('settingsResult');

    // Debug: Check if elements are found
    console.log('Form elements found:', {
        apiForm: !!apiForm,
        submitBtn: !!submitBtn,
        subjectInput: !!subjectInput,
        descriptionInput: !!descriptionInput,
        workNoteInput: !!workNoteInput,
        privateNoteCheckbox: !!privateNoteCheckbox,
        companySelect: !!companySelect,
        contactSelect: !!contactSelect,
        emailNotificationSelect: !!emailNotificationSelect
    });

    // Load saved settings and populate dropdowns on startup
    loadSettings();
    populateCompanyDropdown();

    // Company selection handler
    companySelect.addEventListener('change', function() {
        console.log('Company selected:', this.value);
        populateContactDropdown(this.value);
    });

    // Settings navigation
    settingsBtn.addEventListener('click', function () {
        showSettingsView();
    });

    backBtn.addEventListener('click', function () {
        showMainView();
    });

    // Settings form submission
    settingsForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveSettings();
    });

    // Main ticket form submission
    submitBtn.addEventListener('click', async function (e) {
        console.log('Form submit event triggered!');
        e.preventDefault();

        const subject = subjectInput.value.trim();
        const description = descriptionInput.value.trim();
        const workNote = workNoteInput.value.trim();
        const isPrivateNote = privateNoteCheckbox.checked;
        const companyId = companySelect.value;
        const contactId = contactSelect.value;
        const emailNotification = emailNotificationSelect.value === 'true';
        const timeSpent = timeSpentInput.value.trim();

        console.log('Form values:', {subject, description, workNote, isPrivateNote, companyId, contactId, emailNotification, timeSpent});

        if (!subject || !companyId || !contactId) {
            showResult('Please fill in all required fields', 'error');
            return;
        }

        // Get the contact email from the selected option's data attribute
        const selectedOption = contactSelect.options[contactSelect.selectedIndex];
        const contactEmail = selectedOption.dataset.email;
        
        if (!contactEmail) {
            showResult('Selected contact email not found', 'error');
            return;
        }

        try {
            const ticketData = await createFreshdeskTicket({
                subject: subject,
                description: description,
                email: contactEmail,
                companyId: parseInt(companyId),
                priority: 2,
                status: 2,
                source: (emailNotification? 2 : 101) // 2 for phone, 101 for internal
            });
            
            // If work note is provided, create note
            if (workNote) {
                await createTicketNote(ticketData.id, workNote, isPrivateNote);
            }
            
            // If time spent is provided, create time entry
            if (timeSpent) {
                await createTimeEntry(ticketData.id, timeSpent, subject);
            }
        } catch (error) {
            showResult(`Error creating ticket: ${error.message}`, 'error');
        }
    });

    async function populateCompanyDropdown() {
        try {
            const companies = await getStoredCompanies();
            
            // Clear existing options except the first one
            companySelect.innerHTML = '<option value="">Select Company</option>';
            
            // Add company options
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                companySelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Failed to populate company dropdown:', error);
        }
    }

    async function populateContactDropdown(companyId) {
        try {
            // Clear existing options
            contactSelect.innerHTML = '<option value="">Select Contact</option>';
            
            if (!companyId) {
                contactSelect.disabled = true;
                contactSelect.innerHTML = '<option value="">Select Company First</option>';
                return;
            }
            
            // Show loading state
            contactSelect.disabled = true;
            contactSelect.innerHTML = '<option value="">Loading contacts...</option>';
            
            const contacts = await fetchContacts(companyId);
            
            // Clear loading state
            contactSelect.innerHTML = '<option value="">Select Contact</option>';
            
            if (contacts.length === 0) {
                console.log('No contacts found for this company');
                contactSelect.disabled = true;
                contactSelect.innerHTML = '<option value="">No contacts found for this company</option>';
                return;
            }
            
            console.log('Found contacts:', contacts);
            
            // Enable the dropdown and add contacts
            contactSelect.disabled = false;
            contacts.forEach(contact => {
                console.log('Adding contact:', contact);
                const option = document.createElement('option');
                option.value = contact.id;
                option.textContent = `${contact.name} (${contact.email})`;
                option.dataset.email = contact.email; // Store email as data attribute
                contactSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Failed to populate contact dropdown:', error);
            contactSelect.disabled = true;
            contactSelect.innerHTML = '<option value="">Error loading contacts</option>';
        }
    }

    async function createFreshdeskTicket(ticketData) {
        // Show loading state
        showLoading(true);
        hideResult();
        submitBtn.disabled = true;

        try {
            // Get saved settings
            const settings = await getStoredSettings();

            if (!settings.apiKey) {
                throw new Error('Freshdesk API key not configured. Please check settings.');
            }

            if (!settings.domain) {
                throw new Error('Freshdesk domain not configured. Please check settings.');
            }

            // Prepare the request data
            const requestData = {
                subject: ticketData.subject,
                description: ticketData.description,
                email: ticketData.email,
                company_id: ticketData.companyId,
                priority: ticketData.priority,
                status: ticketData.status,
                source: ticketData.source
            };

            // Add agent_id if provided
            if (settings.agentId) {
                requestData.responder_id = parseInt(settings.agentId);
            }

            // Construct the Freshdesk API URL with email notification parameter
            let apiUrl = `https://${settings.domain}.freshdesk.com/api/v2/tickets`;
            if (!ticketData.emailNotification) {
                apiUrl += '?notify_emails=false';
            }

            // Create the authorization header (API key + 'X' as password)
            const authString = btoa(`${settings.apiKey}:X`);

            const response = await fetch(apiUrl, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json', 
                    'Authorization': `Basic ${authString}`
                }, 
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorData}`);
            }

            const data = await response.json();

            // Show success result with ticket details
            const ticketUrl = `https://${settings.domain}.freshdesk.com/a/tickets/${data.id}`;
            const notificationStatus = ticketData.emailNotification ? 'Email sent' : 'No email sent';
            
            const successMessage = `Ticket created successfully!<br><br>Ticket ID: ${data.id}<br>Subject: ${data.subject}<br>Status: ${getStatusText(data.status)}<br>Priority: ${getPriorityText(data.priority)}<br>${notificationStatus}<br><br><a href="${ticketUrl}" target="_blank" rel="noopener noreferrer">View ticket</a>`;
            showResult(successMessage, 'success', true);

            // Clear form fields
            apiForm.reset();
            // Reset dropdowns to initial state
            contactSelect.disabled = true;
            contactSelect.innerHTML = '<option value="">Select Company First</option>';
            // Reset email notification to default
            emailNotificationSelect.value = 'true';
            
            return data;

        } catch (error) {
            console.error('Freshdesk API call failed:', error);
            showResult(`Error creating ticket: ${error.message}`, 'error');
        } finally {
            showLoading(false);
            submitBtn.disabled = false;
        }
    }

    async function createTimeEntry(ticketId, timeSpent, note) {
        try {
            // Get saved settings
            const settings = await getStoredSettings();

            if (!settings.apiKey) {
                throw new Error('Freshdesk API key not configured. Please check settings.');
            }

            if (!settings.domain) {
                throw new Error('Freshdesk domain not configured. Please check settings.');
            }

            if (!settings.agentId) {
                console.warn('Agent ID not configured, time entry will be created without agent ID');
            }

            // Format time spent as HH:MM
            const formattedTimeSpent = formatTimeSpent(timeSpent);
            
            // Prepare the request data
            const requestData = {
                note: note,
                time_spent: formattedTimeSpent
            };
            
            // Add agent_id if provided
            if (settings.agentId) {
                requestData.agent_id = parseInt(settings.agentId);
            }

            // Construct the Freshdesk API URL for time entries
            const apiUrl = `https://${settings.domain}.freshdesk.com/api/v2/tickets/${ticketId}/time_entries`;

            // Create the authorization header (API key + 'X' as password)
            const authString = btoa(`${settings.apiKey}:X`);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorData}`);
            }

            console.log(`Time entry created successfully for ticket ${ticketId}`);

        } catch (error) {
            console.error('Failed to create time entry:', error);
            showResult(`Warning: Ticket created but failed to add time entry: ${error.message}`, 'warning');
        }
    }

    function formatTimeSpent(hours) {
        // Convert decimal hours to HH:MM format
        const totalMinutes = Math.round(parseFloat(hours) * 60);
        const hoursPart = Math.floor(totalMinutes / 60);
        const minutesPart = totalMinutes % 60;
        return `${hoursPart.toString().padStart(2, '0')}:${minutesPart.toString().padStart(2, '0')}`;
    }

    function getPriorityText(priority) {
        const priorities = {1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent'};
        return priorities[priority] || 'Unknown';
    }

    function getStatusText(status) {
        const statuses = {2: 'Open', 3: 'Pending', 4: 'Resolved', 5: 'Closed'};
        return statuses[status] || 'Unknown';
    }

    function showSettingsView() {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
        settingsBtn.classList.add('hidden');
    }

    function showMainView() {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
        hideSettingsResult();
        settingsBtn.classList.remove('hidden');
    }

    async function saveSettings() {
        const apiKey = apiKeyInput.value.trim();
        const domain = domainInput.value.trim();
        const agentId = agentIdInput.value.trim();

        if (!apiKey || !domain) {
            showSettingsResult('Please fill in both API key and domain', 'error');
            return;
        }

        // Validate domain format (no special characters except hyphens)
        if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
            showSettingsResult('Domain should only contain letters, numbers, and hyphens', 'error');
            return;
        }

        try {
            // Show loading state for settings
            showSettingsResult('Saving settings and fetching companies...', 'info');

            // Test the API connection by fetching companies only
            const companies = await fetchCompanies(apiKey, domain);

            const settings = {
                apiKey: apiKey,
                domain: domain,
                agentId: agentId
            };

            // Save settings and companies to browser storage (no contacts)
            await browser.storage.local.set({ 
                settings: settings,
                companies: companies
            });

            showSettingsResult(`Settings saved successfully! Found ${companies.length} companies.`, 'success');

            // Refresh the company dropdown in the main form
            populateCompanyDropdown();

        } catch (error) {
            console.error('Failed to save settings:', error);
            showSettingsResult(`Failed to save settings: ${error.message}`, 'error');
        }
    }

    async function fetchCompanies(apiKey, domain) {
        try {
            // Construct the Freshdesk API URL for companies
            const apiUrl = `https://${domain}.freshdesk.com/api/v2/companies`;
            
            // Create the authorization header (API key + 'X' as password)
            const authString = btoa(`${apiKey}:X`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to fetch companies (HTTP ${response.status}): ${errorData}`);
            }
            
            const companies = await response.json();
            console.log('Companies fetched successfully:', companies.length);
            
            return companies;
            
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            throw new Error(`Unable to fetch companies. Please check your API key and domain. ${error.message}`);
        }
    }

    async function fetchContacts(companyId) {
        try {
            const settings = await getStoredSettings();

            if (!settings.apiKey) {
                throw new Error('Freshdesk API key not configured. Please check settings.');
            }

            if (!settings.domain) {
                throw new Error('Freshdesk domain not configured. Please check settings.');
            }

            // Construct the Freshdesk API URL for contacts with company filter
            const apiUrl = `https://${settings.domain}.freshdesk.com/api/v2/contacts?company_id=${companyId}`;
            
            // Create the authorization header (API key + 'X' as password)
            const authString = btoa(`${settings.apiKey}:X`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to fetch contacts (HTTP ${response.status}): ${errorData}`);
            }
            
            const contacts = await response.json();
            console.log('Contacts fetched successfully:', contacts.length);
            
            return contacts;
            
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
            throw new Error(`Unable to fetch contacts. Please check your API key and domain. ${error.message}`);
        }
    }

    async function loadSettings() {
        try {
            const settings = await getStoredSettings();
            apiKeyInput.value = settings.apiKey || '';
            domainInput.value = settings.domain || '';
            agentIdInput.value = settings.agentId || '';
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async function getStoredSettings() {
        try {
            const result = await browser.storage.local.get('settings');
            return result.settings || {};
        } catch (error) {
            console.error('Failed to get stored settings:', error);
            return {};
        }
    }

    async function getStoredCompanies() {
        try {
            const result = await browser.storage.local.get('companies');
            return result.companies || [];
        } catch (error) {
            console.error('Failed to get stored companies:', error);
            return [];
        }
    }

    function showResult(message, type, isHtml = false) {
        resultDiv.innerHTML = message;
        resultDiv.className = `result ${type}`;
        resultDiv.classList.remove('hidden');
    }

    function hideResult() {
        resultDiv.classList.add('hidden');
    }

    function showSettingsResult(message, type) {
        settingsResultDiv.textContent = message;
        settingsResultDiv.className = `result ${type}`;
        settingsResultDiv.classList.remove('hidden');
    }

    function hideSettingsResult() {
        settingsResultDiv.classList.add('hidden');
    }

    function showLoading(show) {
        if (show) {
            loadingDiv.classList.remove('hidden');
        } else {
            loadingDiv.classList.add('hidden');
        }
    }

    async function createTicketNote(ticketId, noteBody, isPrivate) {
        try {
            // Get saved settings
            const settings = await getStoredSettings();

            if (!settings.apiKey) {
                throw new Error('Freshdesk API key not configured. Please check settings.');
            }

            if (!settings.domain) {
                throw new Error('Freshdesk domain not configured. Please check settings.');
            }

            // Prepare the request data
            const requestData = {
                body: noteBody,
                private: isPrivate
            };

            // Construct the Freshdesk API URL for notes
            const apiUrl = `https://${settings.domain}.freshdesk.com/api/v2/tickets/${ticketId}/notes`;

            // Create the authorization header (API key + 'X' as password)
            const authString = btoa(`${settings.apiKey}:X`);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorData}`);
            }

            console.log(`Work note created successfully for ticket ${ticketId}`);

        } catch (error) {
            console.error('Failed to create work note:', error);
            showResult(`Warning: Ticket created but failed to add work note: ${error.message}`, 'warning');
        }
    }
});
