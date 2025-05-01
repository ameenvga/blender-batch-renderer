# Blender Batch Renderer

An Electron-based application for creating batch files to render multiple Blender projects.

## Features

- Select Blender executable
- Drag and drop multiple Blender files
- Configure render settings (start/end frames)
- Set CPU core usage
- Option to shut down system after rendering
- Monitor rendering progress with preview

## Installation

```bash
# Clone the repository
git clone https://github.com/ameenvga/blender-batch-renderer.git

# Navigate to the directory
cd blender-batch-renderer

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

1. Select your Blender executable using the "Browse" button
2. Drag and drop your .blend files into the application
3. Set start and end frames for each file
4. Choose output folder
5. Set number of CPU cores to use
6. Save the batch file
7. Click "Render" to start the rendering process

## Development

The application is built with Electron and follows a modular architecture:

```
src/
├── main/           # Main process code
├── renderer/       # Renderer process code
    ├── components/ # UI components
    ├── services/   # Business logic
    └── utils/      # Utility functions
```

### Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode with DevTools
- `npm run pack` - Package the app without distribution
- `npm run dist` - Build distributable packages

## Build

Pre-built executables are available in the `dist` folder.

## License

CC0-1.0
