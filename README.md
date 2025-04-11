# NotForGot Landing Page

A modern, interactive landing page built with Next.js, featuring a beautiful UI with floating animations, phone number collection, and EmailJS integration.

## ✨ Features

- 🎨 **Stunning Visual Design**
  - Floating circle animations (will replace with pictures of us later)
  - Gradient backgrounds
  - Responsive layout
  - Smooth transitions and effects

- 📱 **Interactive Components**
  - Phone number input with international support
  - Form validation and submission
  - EmailJS integration for notifications
  - Dynamic UI states (loading, success, error)

- 🚀 **Modern Tech Stack**
  - Next.js 13 with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Radix UI components

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/)
- **Phone Input:** [react-phone-number-input](https://github.com/catamphetamine/react-phone-number-input)
- **Email Integration:** [EmailJS](https://www.emailjs.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notforgot-landing.git
   cd notforgot-landing
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file based on `.env.template`:
   ```bash
   cp .env.template .env
   ```

4. Fill in your EmailJS credentials in the `.env` file:
   ```
   EMAILJS_SERVICE_ID=your_service_id
   EMAILJS_TEMPLATE_ID=your_template_id
   EMAILJS_PUBLIC_KEY=your_public_key
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
# or
yarn build
```

## 📁 Project Structure

```
notforgot-landing/
├── app/                    # Next.js app directory
│   ├── components/         # Reusable components
│   ├── styles/            # CSS styles
│   └── page.tsx           # Main page component
├── public/                # Static assets
├── components/            # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── ...config files
```

## 🎨 Design System

The project uses a consistent color scheme and design tokens:

- **Primary Colors:**
  - Purple: `#8B5CF6` to `#4C1D95`
  - Amber: `#F59E0B` to `#92400E`

- **Typography:**
  - Headings: Inter font family
  - Body: System font stack

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for the accessible components
- [Framer Motion](https://www.framer.com/motion/) for the animation library 