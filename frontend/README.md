# VizFlow Frontend

A modern React application for data processing and visualization dashboard built with React 18, Tailwind CSS, and Recharts.

## Features

- 🎨 **Modern UI/UX**: Clean, professional interface with Tailwind CSS v3
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 📊 **Interactive Charts**: Data visualization with Recharts library
- 🎯 **Drag & Drop Upload**: Intuitive file upload with progress tracking
- 🔍 **Advanced Search & Filtering**: Find data quickly with powerful filters
- 📈 **Real-time Analytics**: Live insights and error monitoring
- 🌐 **API Integration**: Seamless backend communication with error handling
- ♿ **Accessible**: Built with accessibility best practices

## Tech Stack

- **React 18** - Latest React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **Tailwind CSS v3** - Utility-first CSS framework with custom design system
- **React Router v6** - Client-side routing
- **Recharts** - Composable charting library
- **Axios** - HTTP client for API calls
- **React Dropzone** - File upload with drag & drop
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant notification system

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui.jsx           # Base UI components (Button, Card, etc.)
│   │   ├── Layout.jsx       # App layout with navigation
│   │   └── UploadForm.jsx   # File upload component
│   ├── pages/               # Page components
│   │   ├── DashboardPage.jsx
│   │   ├── UploadPage.jsx
│   │   ├── DataPage.jsx
│   │   ├── ErrorsPage.jsx
│   │   └── InsightsPage.jsx
│   ├── services/            # API services
│   │   └── api.js          # API client and endpoints
│   ├── hooks/               # Custom React hooks
│   │   └── index.js        # useApi, usePagination, etc.
│   ├── utils/               # Utility functions
│   │   └── helpers.js      # Helper functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles and Tailwind imports
├── public/                 # Static assets
├── package.json
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── postcss.config.js      # PostCSS configuration
```

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables:**
   Create `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Pages Overview

### 1. Dashboard (`/`)
- **Overview**: System status and key metrics
- **Quick Actions**: Navigate to main features
- **Recent Activity**: Latest uploads and file statistics
- **System Health**: API status and performance indicators

### 2. Upload (`/upload`)
- **File Upload**: Drag & drop or click to upload
- **Progress Tracking**: Real-time upload progress
- **Format Support**: PDF, CSV, JSON, XML, Images (PNG, JPG, JPEG)
- **Processing Results**: Immediate feedback on upload success/errors
- **Tips & Guidelines**: Best practices for file uploads

### 3. Clean Data (`/data`)
- **Data Browser**: Paginated view of all cleaned datasets
- **Search & Filter**: Find specific documents by name, type, date
- **Record Viewer**: Detailed view of individual document records
- **Download Options**: Export data in CSV, JSON, or XML formats
- **Bulk Operations**: Download all data or delete multiple documents

### 4. Error Logs (`/errors`)
- **Error Overview**: Summary statistics and error distribution
- **Error Browser**: Paginated view of all error logs
- **Error Analysis**: Detailed breakdown of error types and severity
- **Filtering**: Filter by severity, error type, file type
- **Error Details**: Drill down into specific errors with context

### 5. Insights (`/insights`)
- **Analytics Dashboard**: Visual data analysis with interactive charts
- **File Type Distribution**: Pie chart of processed file types
- **Error Trends**: Time series analysis of error patterns
- **Performance Metrics**: Processing success rates and timing
- **Data Quality**: Quality scores and improvement recommendations

## Components

### Core UI Components (`components/ui.jsx`)

- **Button**: Customizable button with variants and loading states
- **Card**: Container component with consistent styling
- **Input/Select**: Form controls with validation styling
- **Table**: Data table with sorting and pagination
- **Modal**: Overlay component for detailed views
- **Badge**: Status indicators and labels
- **LoadingSpinner**: Loading state indicators
- **Pagination**: Table pagination controls
- **EmptyState**: Placeholder for empty data states

### Custom Hooks (`hooks/index.js`)

- **useApi**: API data fetching with loading states
- **usePagination**: Pagination state management
- **useSearch**: Debounced search functionality
- **useFilters**: Filter state management
- **useLocalStorage**: Persistent client-side storage
- **useToggle**: Boolean state toggle helper

### API Service (`services/api.js`)

- **Axios Configuration**: Base URL, timeouts, interceptors
- **Error Handling**: Consistent error processing
- **Upload API**: File upload with progress tracking
- **Data API**: CRUD operations for cleaned data
- **Errors API**: Error log management
- **Download API**: File export functionality

## Styling

### Tailwind CSS Configuration

- **Custom Colors**: Extended color palette with primary, success, warning, error variants
- **Typography**: Inter font family with consistent sizing
- **Components**: Custom component classes for buttons, cards, inputs
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Dark Mode**: Ready for dark mode implementation

### Design System

- **Spacing**: Consistent spacing scale (4px base unit)
- **Border Radius**: Rounded corners for modern look
- **Shadows**: Subtle drop shadows for depth
- **Animation**: Smooth transitions and hover effects
- **Accessibility**: High contrast ratios and keyboard navigation

## Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Optimized asset loading
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Debounced Search**: Reduced API calls during search
- **Virtual Scrolling**: Efficient rendering of large lists

## Accessibility Features

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant colors
- **Alt Text**: Descriptive text for images and icons

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Build Configuration
VITE_BUILD_MODE=production
```

## Deployment

### Vite Build
```bash
npm run build
```

### Static Hosting
Deploy the `dist` folder to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

### Docker
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

### Testing

```bash
# Unit tests (when implemented)
npm run test

# E2E tests (when implemented)
npm run test:e2e
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript types for new components
3. Add proper error handling
4. Include responsive design considerations
5. Test across different browsers and devices

## License

MIT License - see LICENSE file for details.