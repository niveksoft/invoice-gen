# Invoice Generator

A clean, modern, and client-side invoice generator built with vanilla HTML, CSS, and JavaScript. Create professional PDF invoices directly in your browser with a sleek New York-style design.

## Features

- **Client-Side Generation**: All data stays in your browser. No server-side storage.
- **Professional PDF Output**: Generates high-quality, printable PDF invoices using `jsPDF`.
- **Modern UI**: Clean, minimal interface with a light "New York" aesthetic (zinc palette).
- **Profile Management**:
  - Save and load multiple **Issuer Profiles** (your details).
  - Save and load multiple **Client Profiles** (recipient details).
- **Dynamic Line Items**: Add, remove, and edit line items with automatic calculations.
- **Automatic Calculations**: Real-time updates for subtotal, taxes, and grand totals.
- **Customizable Options**:
  - Set tax rates and shipping fees.
  - Add invoice status watermarks (Draft, Paid, Overdue, Void).
  - Include payment instructions and notes.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Usage

1. **Open the Application**: Simply open `index.html` in any modern web browser.
2. **Fill in Details**:
   - Enter your information (Issuer) or select a saved profile.
   - Enter the recipient's information (Client) or select a saved client.
   - Add invoice details (Number, Date, Due Date).
3. **Add Items**: Click "Add Line Item" to list products or services.
4. **Review Totals**: Adjust tax rate and shipping if necessary.
5. **Generate**: Click the **Generate** button in the bottom right corner to download your PDF invoice.

## Technologies

- **HTML5**
- **CSS3** (Custom variables, Flexbox, Grid)
- **JavaScript** (ES6+)
- **jsPDF** (PDF generation library)

## License

MIT License
