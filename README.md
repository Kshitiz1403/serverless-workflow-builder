# Serverless Workflow Builder

A visual drag-and-drop editor for creating and managing [Serverless Workflows](https://serverlessworkflow.io/) with an intuitive React-based interface.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue?logo=github)](https://kshitiz1403.github.io/serverless-workflow-builder)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![React Flow](https://img.shields.io/badge/React%20Flow-11.10.4-purple?logo=react)](https://reactflow.dev/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

## 🚀 Live Demo

Try the editor live at: **[https://kshitiz1403.github.io/serverless-workflow-builder](https://kshitiz1403.github.io/serverless-workflow-builder)**

## ✨ Features

### 🎨 Visual Workflow Design

- **Drag & Drop Interface**: Intuitive node-based workflow creation
- **Real-time Visual Feedback**: See your workflow structure as you build
- **Smart Connection System**: Easy linking between workflow states
- **Auto-layout**: Intelligent node positioning for imported workflows

### 🔧 Comprehensive Node Support

- **Start Node**: Workflow entry points
- **Operation Node**: Function calls and actions
- **Switch Node**: Conditional branching with data/event conditions
- **Event Node**: Event-driven state transitions
- **End Node**: Workflow termination points

### 📊 Advanced Switch Conditions

- **Data Conditions**: Expression-based branching (`.data == true`)
- **Event Conditions**: Event-driven decision making
- **Visual Condition Labels**: Clear condition identification on connections
- **Default Fallback**: Support for default transition paths

### 💾 Import/Export Capabilities

- **JSON Import**: Load existing serverless workflow definitions
- **JSON Export**: Generate compliant serverless workflow JSON
- **Example Workflows**: Pre-built templates to get started
- **File Upload**: Direct .json file import support

### 🔄 Workflow Management

- **Auto-save**: Automatic local storage backup
- **New Workflow**: Quick workflow reset with confirmation
- **Live Editing**: Real-time property updates
- **Undo/Redo**: Undo/Redo the last applied actions

### 🎯 Standards Compliance

- **Serverless Workflow Spec**: Full compliance with [v0.9.x specification](https://github.com/serverlessworkflow/specification)
- **Action Support**: Function references, expressions, and configurations
- **Event Integration**: Complete event state and condition support
- **Metadata Preservation**: Maintains workflow metadata on import/export

## 🛠️ Technology Stack

- **Frontend**: React 18.2.0
- **Flow Library**: React Flow 11.x
- **Icons**: Lucide React
- **Styling**: Pure CSS with modern design
- **Build Tool**: Create React App
- **Deployment**: GitHub Pages

## 📦 Installation

### Prerequisites

- Node.js 16+ (recommended: Node.js 18)
- npm or yarn package manager

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/kshitiz1403/serverless-workflow-builder.git
   cd serverless-workflow-builder
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🎮 Usage Guide

### Creating a New Workflow

1. **Add Nodes**: Drag node types from the left palette onto the canvas
2. **Connect Nodes**: Click and drag from output handles to input handles
3. **Configure Properties**: Select nodes to edit their properties in the sidebar
4. **Set Conditions**: For switch nodes, configure data or event conditions
5. **Export**: Use the "Export JSON" button to generate workflow definition

### Importing Existing Workflows

1. **Click "Import JSON"** in the sidebar
2. **Choose Method**:
   - Paste JSON directly into the text area
   - Upload a .json file
   - Load example workflows
3. **Click "Import Workflow"** to visualize

### Node Types & Configuration

#### Start Node

- Entry point for workflow execution
- Configure workflow metadata

#### Operation Node

- Define function calls and actions
- Set function references and parameters
- Configure retry policies and timeouts

#### Switch Node

- **Data Conditions**: Use expressions like `.data == true`
- **Event Conditions**: Reference specific events
- **Default Path**: Fallback transition option
- Multiple output connections for each condition

#### Event Node

- Configure event references and timeouts
- Set up event-driven state transitions
- Handle event correlation and data filtering

#### End Node

- Terminate workflow execution
- Define completion status and outputs

## ⚙️ Configuration

### API Settings

The application includes a configuration interface for connecting to external operations APIs:

1. **Access Settings**: Click the **Settings** button in the sidebar footer
2. **Configure API URL**: Set the base URL for your operations API (default: `http://localhost:3001`)
3. **Test Connection**: Use the "Test Connection" button to verify API connectivity
4. **Advanced Options**: Configure request timeout and retry attempts
5. **Auto-save**: All settings are automatically saved to browser localStorage

### Key Configuration Options:

- **Base URL**: The operations API endpoint
- **Request Timeout**: How long to wait for API responses (default: 30 seconds)
- **Retry Attempts**: Number of retry attempts for failed requests (default: 3)
- **Connection Status**: Real-time API connectivity indicator

The settings modal provides a health check feature that tests your API connection and displays the number of available operations.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── nodes/              # Node type definitions
│   │   ├── StartNode.js
│   │   ├── OperationNode.js
│   │   ├── SwitchNode.js
│   │   ├── EventNode.js
│   │   └── EndNode.js
│   ├── WorkflowEditor.js   # Main canvas component
│   ├── Sidebar.js          # Node palette & properties
│   ├── NodePropertiesEditor.js
│   ├── JsonImporter.js     # Import functionality
│   └── JsonExporter.js     # Export functionality
├── styles/                 # CSS files
└── example_workflows/      # Sample workflow definitions
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit: `git commit -m "Add feature description"`
5. Push: `git push origin feature-name`
6. Create a Pull Request

### Areas for Contribution

- **New Node Types**: Implement additional serverless workflow states
- **UI/UX Improvements**: Enhance the visual design and user experience
- **Export Formats**: Add support for other workflow formats
- **Validation**: Implement workflow validation and error checking
- **Testing**: Add unit and integration tests
- **Documentation**: Improve guides and examples

## 📋 Roadmap

- [ ] **Workflow Validation**: Real-time error checking and validation
- [x] **Undo/Redo System**: Full action history management
- [ ] **Collaborative Editing**: Multi-user workflow editing
- [ ] **Cloud Storage**: Save workflows to cloud providers
- [ ] **Template Library**: Expanded collection of workflow templates
- [ ] **Advanced Debugging**: Workflow execution simulation
- [x] **Export Formats**: Support for additional workflow standards
- [ ] **Duplicate a project**

## 🐛 Known Issues

- Large workflows may experience performance degradation
- Mobile responsiveness needs improvement
- ~Undo/redo functionality not yet implemented~

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Serverless Workflow Community](https://serverlessworkflow.io/) for the specification
- [React Flow](https://reactflow.dev/) for the excellent flow library
- [Lucide](https://lucide.dev/) for beautiful icons
- [Create React App](https://create-react-app.dev/) for the project foundation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kshitiz1403/serverless-workflow-builder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kshitiz1403/serverless-workflow-builder/discussions)
- **Documentation**: [Serverless Workflow Specification](https://github.com/serverlessworkflow/specification)

---

**Built with ❤️ for the Serverless Community**
