# Kottcraft Subway Map

A modern, interactive subway map visualization built with React, TypeScript, and D3.js. This application displays subway networks with stations and connections, featuring zoom controls, customizable styling, dark mode, search functionality, and automatic data loading from Excel files.

## Features

- **Interactive Map**: Zoom, pan, and navigate the subway network
- **Dark Mode**: Toggle between light and dark themes
- **Search Functionality**: Search and highlight stations on the map
- **Automatic Data Loading**: Reads from Excel files in the public folder
- **Customizable Styling**: Adjust node sizes, label sizes, and line widths
- **Responsive Design**: Modern UI with Tailwind CSS
- **TypeScript**: Fully typed for better development experience
- **Keyboard Shortcuts**: Use +, -, and 0 keys for zoom controls

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Prepare Excel Data**: Create an Excel file named `subway_data.xlsx` in the `public` folder with two sheets:
   
   **Stations Sheet** (columns: Name, X, Z):
   - Name: Station name
   - X: X coordinate
   - Z: Z coordinate
   
   **Connections Sheet** (columns: From, To, Line):
   - From: Starting station name
   - To: Destination station name
   - Line: Line/route identifier

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**: Navigate to `http://localhost:3000`

## Excel File Structure

The application expects an Excel file with the following structure:

### Stations Sheet
| Name | X | Z |
|------|---|----|
| Central Station | 0 | 0 |
| North Station | 100 | 50 |
| South Station | 50 | -100 |

### Connections Sheet
| From | To | Line |
|------|----|------|
| Central Station | North Station | Red Line |
| Central Station | South Station | Blue Line |

## Controls

- **Mouse Wheel**: Zoom in/out
- **Mouse Drag**: Pan the map
- **+ Key**: Zoom in
- **- Key**: Zoom out
- **0 Key**: Reset zoom
- **Search Bar**: Type to search for stations
- **Settings Panel**: Adjust visualization parameters
- **Dark Mode Toggle**: Switch between light and dark themes

## Search Functionality

- **Search Bar**: Located at the top center of the screen
- **Real-time Results**: Shows matching stations as you type
- **Station Highlighting**: Selected stations are highlighted on the map
- **Auto-zoom**: Map automatically centers and zooms in to selected stations (70x zoom for dramatic effect)
- **Connection Info**: Shows which lines connect to each station
- **Reset Zoom**: Click the reset zoom button (0) to return to overview and clear highlights

## Dark Mode

- **Toggle Switch**: Located in the settings panel (top-left)
- **Automatic Theming**: All UI elements adapt to the selected theme
- **Smooth Transitions**: Color changes are animated for better UX
- **Persistent**: Theme preference is maintained during the session

## Project Structure

```
src/
├── components/
│   ├── KottcraftSubwayApp.tsx    # Main application component
│   ├── SubwayMap.tsx             # Map visualization component
│   ├── SettingsPanel.tsx         # Settings controls
│   └── SearchPanel.tsx           # Search functionality
├── types/
│   └── subway.ts                 # TypeScript interfaces
├── utils/
│   ├── subwayUtils.ts            # Utility functions
│   └── excelLoader.ts            # Excel data loading
└── app/
    └── page.tsx                  # Main page
```

## Technologies Used

- **React 19**: Modern React with hooks
- **TypeScript**: Type-safe development
- **D3.js**: Data visualization and zoom behavior
- **Tailwind CSS**: Utility-first CSS framework
- **Next.js 15**: React framework with App Router
- **XLSX**: Excel file parsing

## Development

- **Type Checking**: `npm run build`
- **Linting**: `npm run lint`
- **Development**: `npm run dev`

## Troubleshooting

- **No Data Displayed**: Ensure `subway_data.xlsx` exists in the `public` folder
- **Excel Format**: Verify sheets are named "Stations" and "Connections"
- **Column Headers**: Column names should match the expected format (case-insensitive)
- **Debug Mode**: Add `?debug=1` to the URL to see diagnostic information
- **File Location**: Excel file must be in the `public` folder, not the root folder

## Sample Data

A sample CSV file (`sample_subway_data.csv`) is provided in the root folder. You can convert this to Excel format using any spreadsheet application to test the application.

## Recent Changes

- ✅ **Added Dark Mode**: Toggle between light and dark themes
- ✅ **Added Search Functionality**: Search and highlight stations with enhanced zoom
- ✅ **Auto-center on Centralplan**: Map automatically centers on Centralplan station by default
- ✅ **Enhanced Zoom**: Search results zoom in closer (3x) for better station visibility
- ✅ **Reset Functionality**: Reset zoom button clears highlights and returns to overview
- ✅ **Removed Octolinear Routes**: Simplified to straight-line connections
- ✅ **Improved UI**: Better responsive design and accessibility
- ✅ **Enhanced UX**: Smooth transitions and better visual feedback
