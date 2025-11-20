// Invoice Generator Application
(function () {
    'use strict';

    // State
    let itemCounter = 1;

    // DOM Elements
    const elements = {
        // Sender Info
        senderFirstName: document.getElementById('senderFirstName'),
        senderLastName: document.getElementById('senderLastName'),
        senderAddressLine1: document.getElementById('senderAddressLine1'),
        senderAddressLine2: document.getElementById('senderAddressLine2'),
        senderCity: document.getElementById('senderCity'),
        senderProvince: document.getElementById('senderProvince'),
        senderCountry: document.getElementById('senderCountry'),
        senderPostalCode: document.getElementById('senderPostalCode'),
        senderEmail: document.getElementById('senderEmail'),
        senderPhone: document.getElementById('senderPhone'),
        senderPhoneCountry: document.getElementById('senderPhoneCountry'),

        // Issuer Profile Management
        issuerSelect: document.getElementById('issuerSelect'),
        saveIssuerBtn: document.getElementById('saveIssuerBtn'),
        deleteIssuerBtn: document.getElementById('deleteIssuerBtn'),

        // Invoice Details
        invoiceNumber: document.getElementById('invoiceNumber'),
        issueDate: document.getElementById('issueDate'),
        dueDate: document.getElementById('dueDate'),
        invoiceStatus: document.getElementById('invoiceStatus'),

        // Recipient Info
        recipientFirstName: document.getElementById('recipientFirstName'),
        recipientLastName: document.getElementById('recipientLastName'),
        recipientAddressLine1: document.getElementById('recipientAddressLine1'),
        recipientAddressLine2: document.getElementById('recipientAddressLine2'),
        recipientCity: document.getElementById('recipientCity'),
        recipientProvince: document.getElementById('recipientProvince'),
        recipientCountry: document.getElementById('recipientCountry'),
        recipientPostalCode: document.getElementById('recipientPostalCode'),
        recipientEmail: document.getElementById('recipientEmail'),
        recipientPhone: document.getElementById('recipientPhone'),
        recipientPhoneCountry: document.getElementById('recipientPhoneCountry'),

        // Client Management
        clientSelect: document.getElementById('clientSelect'),
        saveClientBtn: document.getElementById('saveClientBtn'),
        deleteClientBtn: document.getElementById('deleteClientBtn'),

        // Items Table
        itemsTableBody: document.getElementById('itemsTableBody'),
        addItemBtn: document.getElementById('addItemBtn'),

        // Payment
        paymentMethod: document.getElementById('paymentMethod'),
        taxRate: document.getElementById('taxRate'),

        // Data Management
        exportDataBtn: document.getElementById('exportDataBtn'),
        importDataBtn: document.getElementById('importDataBtn'),
        importFile: document.getElementById('importFile'),

        // Invoice History & Actions
        invoiceHistoryBody: document.getElementById('invoiceHistoryBody'),
        saveInvoiceBtn: document.getElementById('saveInvoiceBtn'),
        newInvoiceBtn: document.getElementById('newInvoiceBtn'),

        // Totals
        subtotal: document.getElementById('subtotal'),
        shippingFee: document.getElementById('shippingFee'),
        taxAmount: document.getElementById('taxAmount'),
        grandTotal: document.getElementById('grandTotal'),

        // Notes
        notes: document.getElementById('notes'),

        // Generate
        generatePdfBtn: document.getElementById('generatePdfBtn'),
        statusMessage: document.getElementById('statusMessage')
    };

    // LocalStorage keys
    const CLIENTS_STORAGE_KEY = 'invoice-clients';
    const ISSUERS_STORAGE_KEY = 'invoice-issuers';
    const INVOICES_STORAGE_KEY = 'invoice-list';
    const LAST_INVOICE_NUM_KEY = 'last-invoice-number';

    // State
    let currentInvoiceId = null;

    // Initialize
    function init() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        elements.issueDate.value = today;
        elements.dueDate.value = today;

        // Event Listeners
        elements.addItemBtn.addEventListener('click', addLineItem);
        elements.generatePdfBtn.addEventListener('click', generatePDF);
        elements.taxRate.addEventListener('input', updateTotals);
        elements.shippingFee.addEventListener('input', updateTotals);

        // Issuer Profile Management
        elements.issuerSelect.addEventListener('change', loadSelectedIssuer);
        elements.saveIssuerBtn.addEventListener('click', saveIssuer);
        elements.deleteIssuerBtn.addEventListener('click', deleteIssuer);

        // Client Management
        elements.clientSelect.addEventListener('change', loadSelectedClient);
        elements.saveClientBtn.addEventListener('click', saveClient);
        elements.deleteClientBtn.addEventListener('click', deleteClient);

        // Data Management
        elements.exportDataBtn.addEventListener('click', exportData);
        elements.importDataBtn.addEventListener('click', () => elements.importFile.click());
        elements.importFile.addEventListener('change', importData);

        // Invoice Actions
        elements.saveInvoiceBtn.addEventListener('click', saveInvoice);
        elements.newInvoiceBtn.addEventListener('click', resetForm);

        // Delegate event listeners for dynamic items
        elements.itemsTableBody.addEventListener('input', handleItemInput);
        elements.itemsTableBody.addEventListener('click', handleItemRemove);

        // Initial load
        loadIssuerList();
        loadClientList();
        loadInvoices();
        resetForm(); // Sets up new invoice with next number
        updateTotals();

        // Tab Switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                switchTab(tabId);
            });
        });

        // Nested Tab Switching (for editor sub-tabs)
        document.querySelectorAll('.nested-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const nestedTabId = btn.dataset.nestedTab;
                switchNestedTab(nestedTabId);
            });
        });

        // Phone number formatting
        elements.senderPhone.addEventListener('input', (e) => formatPhoneNumber(e.target));
        elements.recipientPhone.addEventListener('input', (e) => formatPhoneNumber(e.target));
    }

    // Format phone number as user types
    function formatPhoneNumber(input) {
        // Get only digits from input
        let digits = input.value.replace(/\D/g, '');

        // Limit to 10 digits for North American format
        if (digits.length > 10) {
            digits = digits.substring(0, 10);
        }

        // Format based on length
        let formatted = '';
        if (digits.length === 0) {
            formatted = '';
        } else if (digits.length <= 3) {
            formatted = `(${digits}`;
        } else if (digits.length <= 6) {
            formatted = `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
        } else {
            formatted = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        }

        input.value = formatted;
    }

    // Get full phone number with country code
    function getFullPhoneNumber(phoneInput, countrySelect) {
        const countryCode = countrySelect.value;
        const number = phoneInput.value.replace(/\D/g, '');
        if (!number) return '';
        return `${countryCode} ${phoneInput.value}`;
    }

    // Parse phone number (extract country code and number)
    function parsePhoneNumber(fullNumber) {
        if (!fullNumber) return { countryCode: '+1', number: '' };

        // Match country code pattern
        const match = fullNumber.match(/^(\+\d+)\s*(.*)$/);
        if (match) {
            return {
                countryCode: match[1],
                number: match[2].replace(/\D/g, '') // Extract digits only
            };
        }

        // If no country code, assume it's just the number
        return {
            countryCode: '+1',
            number: fullNumber.replace(/\D/g, '')
        };
    }

    function switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    }

    function switchNestedTab(nestedTabId) {
        // Update nested tab buttons
        document.querySelectorAll('.nested-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.nestedTab === nestedTabId);
        });

        // Update nested tab content
        document.querySelectorAll('.nested-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${nestedTabId}-tab`);
        });
    }

    // Add new line item
    function addLineItem() {
        const row = document.createElement('tr');
        row.setAttribute('data-row', itemCounter);
        row.innerHTML = `
            <td>
                <input type="text" class="item-description" placeholder="Product or service description" required>
            </td>
            <td>
                <input type="number" class="item-quantity" min="1" value="1" step="1" required>
            </td>
            <td>
            <input type="number" class="item-price" min="0" value="0" step="0.01" required>
        </td>
        <td class="item-amount">CA$0.00</td>
        <td>
            <button type="button" class="btn btn-secondary btn-sm remove-item" title="Remove item">×</button>
        </td>
        `;

        elements.itemsTableBody.appendChild(row);
        itemCounter++;
        updateTotals();

        // Focus on the new item's description field
        row.querySelector('.item-description').focus();
    }

    // Handle item input changes
    function handleItemInput(e) {
        const target = e.target;
        if (target.classList.contains('item-quantity') ||
            target.classList.contains('item-price')) {
            const row = target.closest('tr');
            updateRowAmount(row);
            updateTotals();
        }
    }

    // Handle item removal
    function handleItemRemove(e) {
        if (e.target.classList.contains('remove-item')) {
            const row = e.target.closest('tr');
            const totalRows = elements.itemsTableBody.querySelectorAll('tr').length;

            // Prevent removing the last row
            if (totalRows > 1) {
                row.remove();
                updateTotals();
            } else {
                showMessage('At least one line item is required', 'error');
            }
        }
    }

    // Update individual row amount
    function updateRowAmount(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;

        let amount = quantity * price;

        row.querySelector('.item-amount').textContent = formatCurrency(amount);
    }

    // Update all totals
    function updateTotals() {
        let subtotal = 0;

        // Calculate subtotal from all rows
        const rows = elements.itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;

            let amount = quantity * price;

            subtotal += amount;
        });

        // Calculate tax
        const taxRateValue = parseFloat(elements.taxRate.value) || 0;
        const tax = subtotal * (taxRateValue / 100);

        const shipping = parseFloat(elements.shippingFee.value) || 0;

        const total = subtotal + tax + shipping;

        // Update display
        elements.subtotal.textContent = formatCurrency(subtotal);
        elements.taxAmount.textContent = formatCurrency(tax);
        elements.grandTotal.textContent = formatCurrency(total);
    }

    // Format currency
    function formatCurrency(amount) {
        return `CA$${amount.toFixed(2)}`;
    }

    // Show status message
    function showMessage(message, type = 'success') {
        elements.statusMessage.innerHTML = `
            <div class="${type === 'success' ? 'success-message' : 'error-message'}">
                ${message}
            </div>
        `;

        setTimeout(() => {
            elements.statusMessage.innerHTML = '';
        }, 5000);
    }

    // ===== Issuer Profile Management Functions =====

    // Get all issuers from localStorage
    function getIssuers() {
        const issuersData = localStorage.getItem(ISSUERS_STORAGE_KEY);
        return issuersData ? JSON.parse(issuersData) : [];
    }

    // Save issuers to localStorage
    function saveIssuersToStorage(issuers) {
        localStorage.setItem(ISSUERS_STORAGE_KEY, JSON.stringify(issuers));
    }

    // Load issuer list into dropdown
    function loadIssuerList() {
        const issuers = getIssuers();
        const select = elements.issuerSelect;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">-- Select a profile --</option>';

        // Add issuers to dropdown
        issuers.forEach((issuer, index) => {
            const option = document.createElement('option');
            option.value = index;
            // Display full name from firstName and lastName, or fallback to old 'name' field
            const displayName = issuer.firstName && issuer.lastName
                ? `${issuer.firstName} ${issuer.lastName}`
                : (issuer.name || 'Unknown');
            option.textContent = displayName;
            select.appendChild(option);
        });
    }

    // Save current issuer
    function saveIssuer() {
        const firstName = elements.senderFirstName.value.trim();
        const lastName = elements.senderLastName.value.trim();
        const addressLine1 = elements.senderAddressLine1.value.trim();
        const addressLine2 = elements.senderAddressLine2.value.trim();
        const city = elements.senderCity.value.trim();
        const province = elements.senderProvince.value.trim();
        const country = elements.senderCountry.value.trim();
        const postalCode = elements.senderPostalCode.value.trim();
        const email = elements.senderEmail.value.trim();
        const phone = getFullPhoneNumber(elements.senderPhone, elements.senderPhoneCountry);

        if (!firstName || !lastName) {
            showMessage('❌ Please enter your first and last name before saving', 'error');
            if (!firstName) elements.senderFirstName.focus();
            else elements.senderLastName.focus();
            return;
        }

        const name = `${firstName} ${lastName}`;
        const issuer = {
            firstName,
            lastName,
            addressLine1,
            addressLine2,
            city,
            province,
            country,
            postalCode,
            email,
            phone
        };
        const issuers = getIssuers();

        // Check if issuer already exists
        const existingIndex = issuers.findIndex(i =>
            i.firstName?.toLowerCase() === firstName.toLowerCase() &&
            i.lastName?.toLowerCase() === lastName.toLowerCase()
        );

        if (existingIndex >= 0) {
            // Update existing issuer
            if (confirm(`Profile "${name}" already exists. Update your information?`)) {
                issuers[existingIndex] = issuer;
                saveIssuersToStorage(issuers);
                loadIssuerList();
                elements.issuerSelect.value = existingIndex;
                showMessage(`✅ Profile "${name}" updated successfully!`);
            }
        } else {
            // Add new issuer
            issuers.push(issuer);
            saveIssuersToStorage(issuers);
            loadIssuerList();
            elements.issuerSelect.value = issuers.length - 1;
            showMessage(`✅ Profile "${name}" saved successfully!`);
        }
    }

    // Load selected issuer into form
    function loadSelectedIssuer() {
        const selectedIndex = elements.issuerSelect.value;

        if (selectedIndex === '') {
            // Clear fields if "-- Select a profile --" is chosen
            elements.senderFirstName.value = '';
            elements.senderLastName.value = '';
            elements.senderAddressLine1.value = '';
            elements.senderAddressLine2.value = '';
            elements.senderCity.value = '';
            elements.senderProvince.value = '';
            elements.senderCountry.value = '';
            elements.senderPostalCode.value = '';
            elements.senderEmail.value = '';
            elements.senderPhone.value = '';
            return;
        }

        const issuers = getIssuers();
        const issuer = issuers[selectedIndex];

        if (issuer) {
            // Support both new structured fields and old single name/address fields
            elements.senderFirstName.value = issuer.firstName || '';
            elements.senderLastName.value = issuer.lastName || '';
            elements.senderAddressLine1.value = issuer.addressLine1 || issuer.address || '';
            elements.senderAddressLine2.value = issuer.addressLine2 || '';
            elements.senderCity.value = issuer.city || '';
            elements.senderProvince.value = issuer.province || '';
            elements.senderCountry.value = issuer.country || '';
            elements.senderPostalCode.value = issuer.postalCode || '';
            elements.senderEmail.value = issuer.email || '';

            // Parse phone number to extract country code and number
            const phoneData = parsePhoneNumber(issuer.phone || '');
            elements.senderPhoneCountry.value = phoneData.countryCode;
            elements.senderPhone.value = phoneData.number;
            // Format the phone number
            if (phoneData.number) {
                formatPhoneNumber(elements.senderPhone);
            }
        }
    }

    // Delete selected issuer
    function deleteIssuer() {
        const selectedIndex = elements.issuerSelect.value;

        if (selectedIndex === '') {
            showMessage('❌ Please select a profile to delete', 'error');
            return;
        }

        const issuers = getIssuers();
        const issuer = issuers[selectedIndex];
        const displayName = issuer.firstName && issuer.lastName
            ? `${issuer.firstName} ${issuer.lastName}`
            : (issuer.name || 'this profile');

        if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
            issuers.splice(selectedIndex, 1);
            saveIssuersToStorage(issuers);
            loadIssuerList();

            // Clear form fields
            elements.senderFirstName.value = '';
            elements.senderLastName.value = '';
            elements.senderAddressLine1.value = '';
            elements.senderAddressLine2.value = '';
            elements.senderCity.value = '';
            elements.senderProvince.value = '';
            elements.senderCountry.value = '';
            elements.senderPostalCode.value = '';
            elements.senderEmail.value = '';
            elements.senderPhone.value = '';

            showMessage(`✅ Profile "${displayName}" deleted successfully!`);
        }
    }

    // ===== Client Management Functions =====

    // Get all clients from localStorage
    function getClients() {
        const clientsData = localStorage.getItem(CLIENTS_STORAGE_KEY);
        return clientsData ? JSON.parse(clientsData) : [];
    }

    // Save clients to localStorage
    function saveClientsToStorage(clients) {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    }

    // Load client list into dropdown
    function loadClientList() {
        const clients = getClients();
        const select = elements.clientSelect;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">-- Select a client --</option>';

        // Add clients to dropdown
        clients.forEach((client, index) => {
            const option = document.createElement('option');
            option.value = index;
            // Display full name from firstName and lastName, or fallback to old 'name' field
            const displayName = client.firstName && client.lastName
                ? `${client.firstName} ${client.lastName}`
                : (client.name || 'Unknown');
            option.textContent = displayName;
            select.appendChild(option);
        });
    }

    // Save current client
    function saveClient() {
        const firstName = elements.recipientFirstName.value.trim();
        const lastName = elements.recipientLastName.value.trim();
        const addressLine1 = elements.recipientAddressLine1.value.trim();
        const addressLine2 = elements.recipientAddressLine2.value.trim();
        const city = elements.recipientCity.value.trim();
        const province = elements.recipientProvince.value.trim();
        const country = elements.recipientCountry.value.trim();
        const postalCode = elements.recipientPostalCode.value.trim();
        const email = elements.recipientEmail.value.trim();
        const phone = elements.recipientPhone.value.trim();

        if (!firstName || !lastName) {
            showMessage('❌ Please enter client first and last name before saving', 'error');
            if (!firstName) elements.recipientFirstName.focus();
            else elements.recipientLastName.focus();
            return;
        }

        const name = `${firstName} ${lastName}`;
        const client = {
            firstName,
            lastName,
            addressLine1,
            addressLine2,
            city,
            province,
            country,
            postalCode,
            email,
            phone
        };
        const clients = getClients();

        // Check if client already exists
        const existingIndex = clients.findIndex(c =>
            c.firstName?.toLowerCase() === firstName.toLowerCase() &&
            c.lastName?.toLowerCase() === lastName.toLowerCase()
        );

        if (existingIndex >= 0) {
            // Update existing client
            if (confirm(`Client "${name}" already exists. Update their information?`)) {
                clients[existingIndex] = client;
                saveClientsToStorage(clients);
                loadClientList();
                elements.clientSelect.value = existingIndex;
                showMessage(`✅ Client "${name}" updated successfully!`);
            }
        } else {
            // Add new client
            clients.push(client);
            saveClientsToStorage(clients);
            loadClientList();
            elements.clientSelect.value = clients.length - 1;
            showMessage(`✅ Client "${name}" saved successfully!`);
        }
    }

    // Load selected client into form
    function loadSelectedClient() {
        const selectedIndex = elements.clientSelect.value;

        if (selectedIndex === '') {
            // Clear fields if "-- Select a client --" is chosen
            elements.recipientFirstName.value = '';
            elements.recipientLastName.value = '';
            elements.recipientAddressLine1.value = '';
            elements.recipientAddressLine2.value = '';
            elements.recipientCity.value = '';
            elements.recipientProvince.value = '';
            elements.recipientCountry.value = '';
            elements.recipientPostalCode.value = '';
            elements.recipientEmail.value = '';
            elements.recipientPhone.value = '';
            return;
        }

        const clients = getClients();
        const client = clients[selectedIndex];

        if (client) {
            // Support both new structured fields and old single name/address fields
            elements.recipientFirstName.value = client.firstName || '';
            elements.recipientLastName.value = client.lastName || '';
            elements.recipientAddressLine1.value = client.addressLine1 || client.address || '';
            elements.recipientAddressLine2.value = client.addressLine2 || '';
            elements.recipientCity.value = client.city || '';
            elements.recipientProvince.value = client.province || '';
            elements.recipientCountry.value = client.country || '';
            elements.recipientPostalCode.value = client.postalCode || '';
            elements.recipientEmail.value = client.email || '';
            elements.recipientPhone.value = client.phone || '';
        }
    }

    // Delete selected client
    function deleteClient() {
        const selectedIndex = elements.clientSelect.value;

        if (selectedIndex === '') {
            showMessage('❌ Please select a client to delete', 'error');
            return;
        }

        const clients = getClients();
        const client = clients[selectedIndex];
        const displayName = client.firstName && client.lastName
            ? `${client.firstName} ${client.lastName}`
            : (client.name || 'this client');

        if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
            clients.splice(selectedIndex, 1);
            saveClientsToStorage(clients);
            loadClientList();

            // Clear form fields
            elements.recipientFirstName.value = '';
            elements.recipientLastName.value = '';
            elements.recipientAddressLine1.value = '';
            elements.recipientAddressLine2.value = '';
            elements.recipientCity.value = '';
            elements.recipientProvince.value = '';
            elements.recipientCountry.value = '';
            elements.recipientPostalCode.value = '';
            elements.recipientEmail.value = '';
            elements.recipientPhone.value = '';

            showMessage(`🗑️ Client "${displayName}" deleted successfully!`);
        }
    }

    // --- Data Management ---

    // Export data to JSON file
    function exportData() {
        const data = {
            issuers: localStorage.getItem(ISSUERS_STORAGE_KEY),
            clients: localStorage.getItem(CLIENTS_STORAGE_KEY),
            invoices: localStorage.getItem(INVOICES_STORAGE_KEY),
            lastInvoiceNum: localStorage.getItem(LAST_INVOICE_NUM_KEY),
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('✅ Data exported successfully!');
    }

    // Import data from JSON file
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                let importedCount = 0;

                if (data.issuers) {
                    localStorage.setItem(ISSUERS_STORAGE_KEY, data.issuers);
                    importedCount++;
                }

                if (data.clients) {
                    localStorage.setItem(CLIENTS_STORAGE_KEY, data.clients);
                    importedCount++;
                }

                if (data.invoices) {
                    localStorage.setItem(INVOICES_STORAGE_KEY, data.invoices);
                    importedCount++;
                }

                if (data.lastInvoiceNum) {
                    localStorage.setItem(LAST_INVOICE_NUM_KEY, data.lastInvoiceNum);
                }

                if (importedCount > 0) {
                    loadIssuerList();
                    loadClientList();
                    loadInvoices();
                    resetForm();
                    showMessage('✅ Data restored successfully!');
                } else {
                    showMessage('⚠️ No valid data found in backup file', 'error');
                }

            } catch (err) {
                console.error('Import error:', err);
                showMessage('❌ Invalid backup file', 'error');
            }

            // Reset file input
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    // --- Invoice History Management ---

    function getInvoices() {
        const invoices = localStorage.getItem(INVOICES_STORAGE_KEY);
        return invoices ? JSON.parse(invoices) : [];
    }

    function saveInvoicesToStorage(invoices) {
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    }

    function loadInvoices() {
        const invoices = getInvoices();
        // Sort by date desc
        invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        elements.invoiceHistoryBody.innerHTML = '';

        if (invoices.length === 0) {
            elements.invoiceHistoryBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted-foreground); padding: 20px;">No invoices saved yet</td></tr>';
            return;
        }

        invoices.forEach(invoice => {
            const row = document.createElement('tr');

            // Format total
            const total = formatCurrency(parseFloat(invoice.totals.grandTotal));

            // Status badge style
            let statusStyle = 'background: var(--zinc-100); color: var(--zinc-600);';
            if (invoice.status === 'PAID') statusStyle = 'background: #dcfce7; color: #166534;';
            if (invoice.status === 'OVERDUE') statusStyle = 'background: #fee2e2; color: #991b1b;';
            if (invoice.status === 'DRAFT') statusStyle = 'background: #f3f4f6; color: #4b5563;';

            row.innerHTML = `
                <td style="font-weight: 500;">${invoice.invoiceNumber}</td>
                <td>${invoice.issueDate}</td>
                <td>${invoice.clientName || '-'}</td>
                <td style="font-weight: 600;">${total}</td>
                <td><span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; ${statusStyle}">${invoice.status || 'Draft'}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-secondary btn-sm edit-invoice" data-id="${invoice.id}" title="Edit">✏️</button>
                        <button type="button" class="btn btn-secondary btn-sm clone-invoice" data-id="${invoice.id}" title="Clone">📋</button>
                        <button type="button" class="btn btn-secondary btn-sm delete-invoice" data-id="${invoice.id}" title="Delete">🗑️</button>
                    </div>
                </td>
            `;
            elements.invoiceHistoryBody.appendChild(row);
        });

        // Add listeners
        document.querySelectorAll('.edit-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                loadInvoice(id);
            });
        });

        document.querySelectorAll('.clone-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                cloneInvoice(id);
            });
        });

        document.querySelectorAll('.delete-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                deleteInvoice(id);
            });
        });
    }

    function getNextInvoiceNumber() {
        const lastNum = localStorage.getItem(LAST_INVOICE_NUM_KEY);
        if (!lastNum) return 'INV-001';

        // Try to increment
        const match = lastNum.match(/(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10) + 1;
            const prefix = lastNum.slice(0, match.index);
            return prefix + num.toString().padStart(match[0].length, '0');
        }
        return lastNum;
    }

    function resetForm() {
        currentInvoiceId = null;

        // Reset fields
        elements.invoiceNumber.value = getNextInvoiceNumber();
        elements.issueDate.valueAsDate = new Date();
        elements.dueDate.valueAsDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 days
        elements.invoiceStatus.value = '';
        elements.paymentMethod.value = '';

        // Reset items
        elements.itemsTableBody.innerHTML = '';
        itemCounter = 0;
        addLineItem(); // Add one empty row

        // Reset totals
        elements.shippingFee.value = 0;
        elements.taxRate.value = 0;
        elements.notes.value = '';

        // Reset client/issuer selection
        elements.clientSelect.value = '';
        elements.issuerSelect.value = '';

        // Clear recipient inputs
        elements.recipientFirstName.value = '';
        elements.recipientLastName.value = '';
        elements.recipientAddressLine1.value = '';
        elements.recipientAddressLine2.value = '';
        elements.recipientCity.value = '';
        elements.recipientProvince.value = '';
        elements.recipientCountry.value = '';
        elements.recipientPostalCode.value = '';
        elements.recipientEmail.value = '';
        elements.recipientPhone.value = '';

        updateTotals();
        showMessage('✨ New invoice started');
    }

    function saveInvoice(silent = false) {
        if (typeof silent !== 'boolean') silent = false;

        // Validate form before saving (unless silent mode for auto-save before PDF generation)
        if (!silent && !validateForm()) {
            return false;
        }

        if (!elements.invoiceNumber.value) {
            if (!silent) showMessage('⚠️ Invoice number is required', 'error');
            return false;
        }

        // Gather items
        const items = [];
        elements.itemsTableBody.querySelectorAll('tr').forEach(row => {
            items.push({
                description: row.querySelector('.item-description').value,
                quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
                price: parseFloat(row.querySelector('.item-price').value) || 0
            });
        });

        // Gather totals
        const totals = {
            subtotal: elements.subtotal.textContent.replace(/[^0-9.-]+/g, ''),
            shipping: elements.shippingFee.value,
            taxRate: elements.taxRate.value,
            taxAmount: elements.taxAmount.textContent.replace(/[^0-9.-]+/g, ''),
            grandTotal: elements.grandTotal.textContent.replace(/[^0-9.-]+/g, '')
        };

        const invoice = {
            id: currentInvoiceId || Date.now().toString(),
            invoiceNumber: elements.invoiceNumber.value,
            issueDate: elements.issueDate.value,
            dueDate: elements.dueDate.value,
            status: elements.invoiceStatus.value,
            paymentMethod: elements.paymentMethod.value,
            notes: elements.notes.value,

            // Client info
            clientId: elements.clientSelect.value,
            clientName: `${elements.recipientFirstName.value} ${elements.recipientLastName.value}`.trim(),
            recipient: {
                firstName: elements.recipientFirstName.value,
                lastName: elements.recipientLastName.value,
                addressLine1: elements.recipientAddressLine1.value,
                addressLine2: elements.recipientAddressLine2.value,
                city: elements.recipientCity.value,
                province: elements.recipientProvince.value,
                country: elements.recipientCountry.value,
                postalCode: elements.recipientPostalCode.value,
                email: elements.recipientEmail.value,
                phone: getFullPhoneNumber(elements.recipientPhone, elements.recipientPhoneCountry)
            },

            // Sender info
            issuerId: elements.issuerSelect.value,
            sender: {
                firstName: elements.senderFirstName.value,
                lastName: elements.senderLastName.value,
                addressLine1: elements.senderAddressLine1.value,
                addressLine2: elements.senderAddressLine2.value,
                city: elements.senderCity.value,
                province: elements.senderProvince.value,
                country: elements.senderCountry.value,
                postalCode: elements.senderPostalCode.value,
                email: elements.senderEmail.value,
                phone: getFullPhoneNumber(elements.senderPhone, elements.senderPhoneCountry)
            },

            items: items,
            totals: totals,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const invoices = getInvoices();

        if (currentInvoiceId) {
            // Update existing
            const index = invoices.findIndex(inv => inv.id === currentInvoiceId);
            if (index !== -1) {
                invoices[index] = { ...invoices[index], ...invoice, createdAt: invoices[index].createdAt }; // Keep original createdAt
            }
        } else {
            // Create new
            invoices.push(invoice);
            // Update last invoice number
            localStorage.setItem(LAST_INVOICE_NUM_KEY, invoice.invoiceNumber);
        }

        saveInvoicesToStorage(invoices);
        loadInvoices();

        // Set current ID so subsequent saves update this one
        currentInvoiceId = invoice.id;

        if (!silent) showMessage('💾 Invoice saved successfully!');
        return true;
    }

    function loadInvoice(id) {
        const invoices = getInvoices();
        const invoice = invoices.find(inv => inv.id === id);

        if (!invoice) return;

        currentInvoiceId = invoice.id;

        // Populate fields
        elements.invoiceNumber.value = invoice.invoiceNumber;
        elements.issueDate.value = invoice.issueDate;
        elements.dueDate.value = invoice.dueDate;
        elements.invoiceStatus.value = invoice.status;
        elements.paymentMethod.value = invoice.paymentMethod;
        elements.notes.value = invoice.notes;

        // Recipient - support both new and old formats
        elements.recipientFirstName.value = invoice.recipient.firstName || '';
        elements.recipientLastName.value = invoice.recipient.lastName || '';
        elements.recipientAddressLine1.value = invoice.recipient.addressLine1 || invoice.recipient.address || '';
        elements.recipientAddressLine2.value = invoice.recipient.addressLine2 || '';
        elements.recipientCity.value = invoice.recipient.city || '';
        elements.recipientProvince.value = invoice.recipient.province || '';
        elements.recipientCountry.value = invoice.recipient.country || '';
        elements.recipientPostalCode.value = invoice.recipient.postalCode || '';
        elements.recipientEmail.value = invoice.recipient.email;

        const recipientPhoneData = parsePhoneNumber(invoice.recipient.phone || '');
        elements.recipientPhoneCountry.value = recipientPhoneData.countryCode;
        elements.recipientPhone.value = recipientPhoneData.number;
        if (recipientPhoneData.number) formatPhoneNumber(elements.recipientPhone);

        // Sender - support both new and old formats
        elements.senderFirstName.value = invoice.sender.firstName || '';
        elements.senderLastName.value = invoice.sender.lastName || '';
        elements.senderAddressLine1.value = invoice.sender.addressLine1 || invoice.sender.address || '';
        elements.senderAddressLine2.value = invoice.sender.addressLine2 || '';
        elements.senderCity.value = invoice.sender.city || '';
        elements.senderProvince.value = invoice.sender.province || '';
        elements.senderCountry.value = invoice.sender.country || '';
        elements.senderPostalCode.value = invoice.sender.postalCode || '';
        elements.senderEmail.value = invoice.sender.email;

        const senderPhoneData = parsePhoneNumber(invoice.sender.phone || '');
        elements.senderPhoneCountry.value = senderPhoneData.countryCode;
        elements.senderPhone.value = senderPhoneData.number;
        if (senderPhoneData.number) formatPhoneNumber(elements.senderPhone);

        // Totals
        elements.shippingFee.value = invoice.totals.shipping;
        elements.taxRate.value = invoice.totals.taxRate;

        // Items
        elements.itemsTableBody.innerHTML = '';
        itemCounter = 0;

        invoice.items.forEach(item => {
            addLineItem();
            const rows = elements.itemsTableBody.querySelectorAll('tr');
            const lastRow = rows[rows.length - 1];

            lastRow.querySelector('.item-description').value = item.description;
            lastRow.querySelector('.item-quantity').value = item.quantity;
            lastRow.querySelector('.item-price').value = item.price;

            updateRowAmount(lastRow);
        });

        updateTotals();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        switchTab('editor');
        showMessage(`📂 Invoice ${invoice.invoiceNumber} loaded`);
    }

    function cloneInvoice(id) {
        const invoices = getInvoices();
        const invoice = invoices.find(inv => inv.id === id);

        if (!invoice) return;

        // Load the invoice data (similar to loadInvoice, but don't set currentInvoiceId)
        currentInvoiceId = null; // Clear this so it saves as a new invoice

        // Populate fields
        elements.invoiceNumber.value = getNextInvoiceNumber(); // Generate new invoice number
        elements.issueDate.value = invoice.issueDate;
        elements.dueDate.value = invoice.dueDate;
        elements.invoiceStatus.value = invoice.status;
        elements.paymentMethod.value = invoice.paymentMethod;
        elements.notes.value = invoice.notes;

        // Recipient - support both new and old formats
        elements.recipientFirstName.value = invoice.recipient.firstName || '';
        elements.recipientLastName.value = invoice.recipient.lastName || '';
        elements.recipientAddressLine1.value = invoice.recipient.addressLine1 || invoice.recipient.address || '';
        elements.recipientAddressLine2.value = invoice.recipient.addressLine2 || '';
        elements.recipientCity.value = invoice.recipient.city || '';
        elements.recipientProvince.value = invoice.recipient.province || '';
        elements.recipientCountry.value = invoice.recipient.country || '';
        elements.recipientPostalCode.value = invoice.recipient.postalCode || '';
        elements.recipientEmail.value = invoice.recipient.email;

        const recipientPhoneData = parsePhoneNumber(invoice.recipient.phone || '');
        elements.recipientPhoneCountry.value = recipientPhoneData.countryCode;
        elements.recipientPhone.value = recipientPhoneData.number;
        if (recipientPhoneData.number) formatPhoneNumber(elements.recipientPhone);

        // Sender - support both new and old formats
        elements.senderFirstName.value = invoice.sender.firstName || '';
        elements.senderLastName.value = invoice.sender.lastName || '';
        elements.senderAddressLine1.value = invoice.sender.addressLine1 || invoice.sender.address || '';
        elements.senderAddressLine2.value = invoice.sender.addressLine2 || '';
        elements.senderCity.value = invoice.sender.city || '';
        elements.senderProvince.value = invoice.sender.province || '';
        elements.senderCountry.value = invoice.sender.country || '';
        elements.senderPostalCode.value = invoice.sender.postalCode || '';
        elements.senderEmail.value = invoice.sender.email;

        const senderPhoneData = parsePhoneNumber(invoice.sender.phone || '');
        elements.senderPhoneCountry.value = senderPhoneData.countryCode;
        elements.senderPhone.value = senderPhoneData.number;
        if (senderPhoneData.number) formatPhoneNumber(elements.senderPhone);

        // Totals
        elements.shippingFee.value = invoice.totals.shipping;
        elements.taxRate.value = invoice.totals.taxRate;

        // Items
        elements.itemsTableBody.innerHTML = '';
        itemCounter = 0;

        invoice.items.forEach(item => {
            addLineItem();
            const rows = elements.itemsTableBody.querySelectorAll('tr');
            const lastRow = rows[rows.length - 1];

            lastRow.querySelector('.item-description').value = item.description;
            lastRow.querySelector('.item-quantity').value = item.quantity;
            lastRow.querySelector('.item-price').value = item.price;

            updateRowAmount(lastRow);
        });

        updateTotals();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        switchTab('editor');
        showMessage(`📋 Invoice cloned as ${elements.invoiceNumber.value}`);
    }

    function deleteInvoice(id) {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        const invoices = getInvoices();
        const newInvoices = invoices.filter(inv => inv.id !== id);

        saveInvoicesToStorage(newInvoices);
        loadInvoices();

        if (currentInvoiceId === id) {
            resetForm();
        }

        showMessage('🗑️ Invoice deleted');
    }

    // Handle company logo upload
    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showMessage('❌ Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            logoDataUrl = event.target.result;

            // Update preview
            const img = elements.logoPreview.querySelector('img');
            img.src = logoDataUrl;
            elements.logoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    // Generate PDF
    async function generatePDF() {
        // Auto-save invoice before generating
        if (!saveInvoice(true)) {
            showMessage('⚠️ Please fix errors before generating', 'error');
            return;
        }

        try {
            // Validate required fields
            if (!validateForm()) {
                return;
            }

            // Show loading state
            const originalText = elements.generatePdfBtn.innerHTML;
            elements.generatePdfBtn.innerHTML = '<span class="loading"></span> Generating...';
            elements.generatePdfBtn.disabled = true;

            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = margin;

            // Watermark - Moved to be rendered near totals

            // Helper function to add text with word wrap
            function addText(text, x, y, options = {}) {
                const maxWidth = options.maxWidth || contentWidth;
                const lineHeight = options.lineHeight || 5;
                const align = options.align || 'left';

                doc.setFont(options.font || 'helvetica', options.style || 'normal');
                doc.setFontSize(options.size || 10);

                const lines = doc.splitTextToSize(text, maxWidth);

                if (align === 'right') {
                    lines.forEach((line, index) => {
                        doc.text(line, x, y + (index * lineHeight), { align: 'right' });
                    });
                } else if (align === 'center') {
                    lines.forEach((line, index) => {
                        doc.text(line, x, y + (index * lineHeight), { align: 'center' });
                    });
                } else {
                    doc.text(lines, x, y);
                }

                return lines.length * lineHeight;
            }

            // Original style - simple and clean
            doc.setTextColor(0, 0, 0);

            // Title - INVOICE
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('INVOICE', margin, yPos);
            yPos += 15;

            // Sender Information (Left side)
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            const senderFullName = `${elements.senderFirstName.value} ${elements.senderLastName.value}`.trim();
            doc.text(senderFullName, margin, yPos);
            yPos += 6;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Invoice details (Right side)
            const rightX = pageWidth - margin;
            let rightY = margin + 15;

            doc.setFont('helvetica', 'bold');
            doc.text('Invoice #:', rightX - 60, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(elements.invoiceNumber.value, rightX, rightY, { align: 'right' });
            rightY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Payment:', rightX - 60, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(elements.paymentMethod.value, rightX, rightY, { align: 'right' });
            rightY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Issue Date:', rightX - 60, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(elements.issueDate.value), rightX, rightY, { align: 'right' });
            rightY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Due Date:', rightX - 60, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(elements.dueDate.value), rightX, rightY, { align: 'right' });
            rightY += 5;

            // Continue sender info on left - format address properly
            yPos += addText(elements.senderAddressLine1.value, margin, yPos, { maxWidth: 100 });
            if (elements.senderAddressLine2.value.trim()) {
                yPos += addText(elements.senderAddressLine2.value, margin, yPos, { maxWidth: 100 });
            }
            const senderLocationLine = `${elements.senderCity.value}, ${elements.senderProvince.value}, ${elements.senderCountry.value} ${elements.senderPostalCode.value}`.trim();
            yPos += addText(senderLocationLine, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.senderEmail.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(getFullPhoneNumber(elements.senderPhone, elements.senderPhoneCountry), margin, yPos, { maxWidth: 100 });
            yPos += 10;

            // BILL TO section (changed from "Issued To")
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', margin, yPos);
            yPos += 7;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            const recipientFullName = `${elements.recipientFirstName.value} ${elements.recipientLastName.value}`.trim();
            doc.text(recipientFullName, margin, yPos);
            yPos += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            yPos += addText(elements.recipientAddressLine1.value, margin, yPos, { maxWidth: 100 });
            if (elements.recipientAddressLine2.value.trim()) {
                yPos += addText(elements.recipientAddressLine2.value, margin, yPos, { maxWidth: 100 });
            }
            const recipientLocationLine = `${elements.recipientCity.value}, ${elements.recipientProvince.value}, ${elements.recipientCountry.value} ${elements.recipientPostalCode.value}`.trim();
            yPos += addText(recipientLocationLine, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.recipientEmail.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(getFullPhoneNumber(elements.recipientPhone, elements.recipientPhoneCountry), margin, yPos, { maxWidth: 100 });
            yPos += 10;

            // Items Table in card style
            const tableY = yPos;

            // Table header
            doc.setFillColor(250, 250, 250); // Very light gray like shadcn
            doc.rect(margin, yPos, contentWidth, 8, 'F');

            doc.setDrawColor(228, 228, 231);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(113, 113, 122);

            const colWidths = {
                description: contentWidth * 0.50,
                quantity: contentWidth * 0.15,
                unitPrice: contentWidth * 0.20,
                amount: contentWidth * 0.15
            };

            doc.text('DESCRIPTION', margin + 4, yPos + 5.5);
            doc.text('QTY', margin + colWidths.description + 4, yPos + 5.5);
            doc.text('RATE', margin + colWidths.description + colWidths.quantity + 4, yPos + 5.5);
            doc.text('AMOUNT', pageWidth - margin - 4, yPos + 5.5, { align: 'right' });

            yPos += 10;

            // Table Rows
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(24, 24, 27); // zinc-900

            const rows = elements.itemsTableBody.querySelectorAll('tr');

            rows.forEach((row, index) => {
                const description = row.querySelector('.item-description').value;
                const quantity = row.querySelector('.item-quantity').value;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;

                let amount = (parseFloat(quantity) || 0) * price;

                // Calculate height needed for this row
                const descLines = doc.splitTextToSize(description, colWidths.description - 8);
                const rowHeight = Math.max(10, descLines.length * 5 + 4);

                // Check if we need a new page
                if (yPos + rowHeight > pageHeight - 40) {
                    doc.addPage();
                    yPos = margin;

                    // Redraw header
                    doc.setFillColor(255, 255, 255);
                    doc.rect(margin, yPos, contentWidth, 10, 'F');
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('DESCRIPTION', margin + 4, yPos + 5.5);
                    doc.text('QTY', margin + colWidths.description + 4, yPos + 5.5);
                    doc.text('RATE', margin + colWidths.description + colWidths.quantity + 4, yPos + 5.5);
                    doc.text('AMOUNT', pageWidth - margin - 4, yPos + 5.5, { align: 'right' });

                    yPos += 10;

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(24, 24, 27);
                }

                // Draw row content
                doc.text(descLines, margin + 4, yPos + 5);
                doc.text(quantity.toString(), margin + colWidths.description + 4, yPos + 5);
                doc.text(formatCurrency(price).replace('CA$', ''), margin + colWidths.description + colWidths.quantity + 4, yPos + 5);
                doc.text(formatCurrency(amount), pageWidth - margin - 4, yPos + 5, { align: 'right' });

                yPos += rowHeight;

                // Thin separator line between rows
                doc.setDrawColor(228, 228, 231); // zinc-200
                doc.setLineWidth(0.1);
                doc.line(margin, yPos, pageWidth - margin, yPos);
            });

            // Totals section - aligned right
            const totalsWidth = 70;
            const totalsX = pageWidth - margin - totalsWidth;
            const totalsLabelX = totalsX;
            const totalsValueX = pageWidth - margin;

            // Add some spacing before totals
            let totalsY = yPos + 10;

            // Check if we need a new page for totals
            if (totalsY + 40 > pageHeight - 40) {
                doc.addPage();
                totalsY = margin;
            }

            // Set font and color for totals labels
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(113, 113, 122); // zinc-500

            // Subtotal
            doc.text('Subtotal:', totalsLabelX, totalsY);
            doc.setTextColor(24, 24, 27); // zinc-900
            doc.text(elements.subtotal.textContent, totalsValueX, totalsY, { align: 'right' });
            totalsY += 5;

            // Shipping
            const shipping = parseFloat(elements.shippingFee.value) || 0;
            if (shipping > 0) {
                doc.setTextColor(113, 113, 122); // zinc-500
                doc.text('Shipping:', totalsLabelX, totalsY);
                doc.setTextColor(24, 24, 27); // zinc-900
                doc.text(formatCurrency(shipping), totalsValueX, totalsY, { align: 'right' });
                totalsY += 5;
            }

            // Tax
            const taxRate = parseFloat(elements.taxRate.value) || 0;
            doc.setTextColor(113, 113, 122); // zinc-500
            doc.text(`Tax (${taxRate}%):`, totalsLabelX, totalsY);
            doc.setTextColor(24, 24, 27); // zinc-900
            doc.text(elements.taxAmount.textContent, totalsValueX, totalsY, { align: 'right' });
            totalsY += 7;

            // Separator line
            doc.setDrawColor(228, 228, 231);
            doc.setLineWidth(0.3);
            doc.line(totalsX, totalsY - 2, pageWidth - margin, totalsY - 2);
            totalsY += 3;

            // Grand Total
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(24, 24, 27);
            doc.text('Total:', totalsLabelX, totalsY);
            doc.text(elements.grandTotal.textContent, totalsValueX, totalsY, { align: 'right' });

            yPos = totalsY + 20;

            // Notes section
            if (elements.notes.value) {
                yPos += 10;

                // Check if we need a new page
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = margin;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Notes:', margin, yPos);
                yPos += 6;

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);

                const noteLines = doc.splitTextToSize(elements.notes.value, contentWidth);
                doc.text(noteLines, margin, yPos);
                yPos += (noteLines.length * 5) + 10;
            }

            // Footer note with cursive style
            doc.setFontSize(11);
            doc.setFont('times', 'italic'); // Cursive-style font
            doc.setTextColor(113, 113, 122); // Slightly darker than before
            doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });

            // Watermark (Bottom right corner - drawn last)
            const status = elements.invoiceStatus.value;
            if (status) {
                doc.saveGraphicsState();
                doc.setTextColor(245, 245, 245); // Extremely light gray
                doc.setFontSize(60);
                doc.setFont('helvetica', 'bold');

                // Position at bottom right corner of the page
                const watermarkX = pageWidth - 40;
                const watermarkY = pageHeight - 30;

                doc.text(status, watermarkX, watermarkY, {
                    align: 'center',
                    angle: 45,
                    renderingMode: 'fill'
                });
                doc.restoreGraphicsState();
            }

            // Save the PDF with File System Access API (if supported)
            const filename = `Invoice-${elements.invoiceNumber.value}.pdf`;
            const pdfBlob = doc.output('blob');

            // Try to use File System Access API for custom save location
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'PDF Documents',
                            accept: { 'application/pdf': ['.pdf'] }
                        }]
                    });

                    const writable = await handle.createWritable();
                    await writable.write(pdfBlob);
                    await writable.close();

                    showMessage(`✅ Invoice saved successfully!`);
                } catch (err) {
                    // User cancelled or error occurred
                    if (err.name !== 'AbortError') {
                        console.error('Error saving file:', err);
                        // Fall back to standard download
                        doc.save(filename);
                        showMessage(`✅ Invoice generated successfully!`);
                    }
                }
            } else {
                // Fall back to standard download for browsers that don't support File System Access API
                doc.save(filename);
                showMessage(`✅ Invoice generated successfully!`);
            }

            // Reset button
            elements.generatePdfBtn.innerHTML = originalText;
            elements.generatePdfBtn.disabled = false;

        } catch (error) {
            console.error('Error generating PDF:', error);
            elements.generatePdfBtn.innerHTML = 'Generate PDF Invoice 📄';
            elements.generatePdfBtn.disabled = false;
            showMessage('❌ Error generating PDF. Please check all fields and try again.', 'error');
        }
    }

    // Validate form
    function validateForm() {
        // 1. Check main form fields
        const requiredFields = [
            // Sender fields
            { element: elements.senderFirstName, name: 'Your First Name' },
            { element: elements.senderLastName, name: 'Your Last Name' },
            { element: elements.senderAddressLine1, name: 'Your Address Line 1' },
            // senderAddressLine2 is optional
            { element: elements.senderCity, name: 'Your City' },
            { element: elements.senderProvince, name: 'Your Province/State' },
            { element: elements.senderCountry, name: 'Your Country' },
            { element: elements.senderPostalCode, name: 'Your Postal Code' },
            { element: elements.senderEmail, name: 'Your Email' },
            { element: elements.senderPhone, name: 'Your Phone' },

            // Invoice details
            { element: elements.invoiceNumber, name: 'Invoice Number' },
            { element: elements.issueDate, name: 'Issue Date' },
            { element: elements.dueDate, name: 'Due Date' },
            { element: elements.paymentMethod, name: 'Payment Method' },

            // Recipient fields
            { element: elements.recipientFirstName, name: 'Recipient First Name' },
            { element: elements.recipientLastName, name: 'Recipient Last Name' },
            { element: elements.recipientAddressLine1, name: 'Recipient Address Line 1' },
            // recipientAddressLine2 is optional
            { element: elements.recipientCity, name: 'Recipient City' },
            { element: elements.recipientProvince, name: 'Recipient Province/State' },
            { element: elements.recipientCountry, name: 'Recipient Country' },
            { element: elements.recipientPostalCode, name: 'Recipient Postal Code' },
            { element: elements.recipientEmail, name: 'Recipient Email' },
            { element: elements.recipientPhone, name: 'Recipient Phone' }
        ];

        for (const field of requiredFields) {
            if (!field.element.value.trim()) {
                showMessage(`❌ Please fill in: ${field.name}`, 'error');
                field.element.focus();
                return false;
            }
        }

        // 2. Check ALL line items
        const rows = elements.itemsTableBody.querySelectorAll('tr');
        if (rows.length === 0) {
            showMessage('❌ Please add at least one item', 'error');
            return false;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const desc = row.querySelector('.item-description');
            const qty = row.querySelector('.item-quantity');
            const price = row.querySelector('.item-price');

            if (!desc.value.trim()) {
                showMessage(`❌ Item ${i + 1}: Description is required`, 'error');
                desc.focus();
                return false;
            }

            if (!qty.value || parseFloat(qty.value) <= 0) {
                showMessage(`❌ Item ${i + 1}: Quantity must be greater than 0`, 'error');
                qty.focus();
                return false;
            }

            if (!price.value || parseFloat(price.value) < 0) {
                showMessage(`❌ Item ${i + 1}: Price is required`, 'error');
                price.focus();
                return false;
            }
        }

        return true;
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Initialize app when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
