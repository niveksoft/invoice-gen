// Invoice Generator Application
(function () {
    'use strict';

    // State
    let itemCounter = 1;

    // DOM Elements
    const elements = {
        // Sender Info
        senderName: document.getElementById('senderName'),
        senderAddress: document.getElementById('senderAddress'),
        senderEmail: document.getElementById('senderEmail'),
        senderPhone: document.getElementById('senderPhone'),

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
        recipientName: document.getElementById('recipientName'),
        recipientAddress: document.getElementById('recipientAddress'),
        recipientEmail: document.getElementById('recipientEmail'),
        recipientPhone: document.getElementById('recipientPhone'),

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

        // Delegate event listeners for dynamic items
        elements.itemsTableBody.addEventListener('input', handleItemInput);
        elements.itemsTableBody.addEventListener('click', handleItemRemove);

        // Initial load
        loadIssuerList();
        loadClientList();
        updateTotals();
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
            option.textContent = issuer.name;
            select.appendChild(option);
        });
    }

    // Save current issuer
    function saveIssuer() {
        const name = elements.senderName.value.trim();
        const address = elements.senderAddress.value.trim();
        const email = elements.senderEmail.value.trim();
        const phone = elements.senderPhone.value.trim();

        if (!name) {
            showMessage('❌ Please enter your name before saving', 'error');
            elements.senderName.focus();
            return;
        }

        const issuer = { name, address, email, phone };
        const issuers = getIssuers();

        // Check if issuer already exists
        const existingIndex = issuers.findIndex(i => i.name.toLowerCase() === name.toLowerCase());

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
            elements.senderName.value = '';
            elements.senderAddress.value = '';
            elements.senderEmail.value = '';
            elements.senderPhone.value = '';
            return;
        }

        const issuers = getIssuers();
        const issuer = issuers[selectedIndex];

        if (issuer) {
            elements.senderName.value = issuer.name || '';
            elements.senderAddress.value = issuer.address || '';
            elements.senderEmail.value = issuer.email || '';
            elements.senderPhone.value = issuer.phone || '';
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

        if (confirm(`Are you sure you want to delete "${issuer.name}"?`)) {
            issuers.splice(selectedIndex, 1);
            saveIssuersToStorage(issuers);
            loadIssuerList();

            // Clear form fields
            elements.senderName.value = '';
            elements.senderAddress.value = '';
            elements.senderEmail.value = '';
            elements.senderPhone.value = '';

            showMessage(`✅ Profile "${issuer.name}" deleted successfully!`);
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
            option.textContent = client.name;
            select.appendChild(option);
        });
    }

    // Save current client
    function saveClient() {
        const name = elements.recipientName.value.trim();
        const address = elements.recipientAddress.value.trim();
        const email = elements.recipientEmail.value.trim();
        const phone = elements.recipientPhone.value.trim();

        if (!name) {
            showMessage('❌ Please enter a client name before saving', 'error');
            elements.recipientName.focus();
            return;
        }

        const client = { name, address, email, phone };
        const clients = getClients();

        // Check if client already exists
        const existingIndex = clients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

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
            elements.recipientName.value = '';
            elements.recipientAddress.value = '';
            elements.recipientEmail.value = '';
            elements.recipientPhone.value = '';
            return;
        }

        const clients = getClients();
        const client = clients[selectedIndex];

        if (client) {
            elements.recipientName.value = client.name || '';
            elements.recipientAddress.value = client.address || '';
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

        if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
            clients.splice(selectedIndex, 1);
            saveClientsToStorage(clients);
            loadClientList();

            // Clear form fields
            elements.recipientName.value = '';
            elements.recipientAddress.value = '';
            elements.recipientEmail.value = '';
            elements.recipientPhone.value = '';

            showMessage(`✅ Client "${client.name}" deleted successfully!`);
        }
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
            doc.text(elements.senderName.value, margin, yPos);
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

            // Continue sender info on left
            yPos += addText(elements.senderAddress.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.senderEmail.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.senderPhone.value, margin, yPos, { maxWidth: 100 });
            yPos += 10;

            // BILL TO section (changed from "Issued To")
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', margin, yPos);
            yPos += 7;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(elements.recipientName.value, margin, yPos);
            yPos += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            yPos += addText(elements.recipientAddress.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.recipientEmail.value, margin, yPos, { maxWidth: 100 });
            yPos += addText(elements.recipientPhone.value, margin, yPos, { maxWidth: 100 });
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
            { element: elements.senderName, name: 'Your Name' },
            { element: elements.senderAddress, name: 'Your Address' },
            { element: elements.senderEmail, name: 'Your Email' },
            { element: elements.senderPhone, name: 'Your Phone' },
            { element: elements.invoiceNumber, name: 'Invoice Number' },
            { element: elements.issueDate, name: 'Issue Date' },
            { element: elements.dueDate, name: 'Due Date' },
            { element: elements.recipientName, name: 'Recipient Name' },
            { element: elements.recipientAddress, name: 'Recipient Address' },
            { element: elements.recipientEmail, name: 'Recipient Email' },
            { element: elements.recipientPhone, name: 'Recipient Phone' },
            { element: elements.paymentMethod, name: 'Payment Method' }
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
