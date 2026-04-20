# Frontend Design Documentation

## Design Overview
The EquiHire frontend is engineered with a focus on accessibility, high-integrity assessment environments, and anonymized recruitment dashboards. The design system prioritizes clarity and efficiency to facilitate a bias-free evaluation process.

---

## Static Prototypes
Architectural and UI reference models are available as static HTML prototypes. These files serve as the blueprint for the React component implementation.

### Recruiter Dashboard Prototype
- **Path:** `react-frontend/design/recruiter-dashboard.html`
- **Functionality:** Job management interfaces, organization configuration, and the invitation orchestration flow.

### Candidate Workflow Prototype
- **Path:** `react-frontend/design/candidate-flow.html`
- **Functionality:** Document upload procedures, secure assessment environments, and the evaluation results interface.

---

## Design Resources

### Figma Workspace
For detailed design tokens, component specifications, and high-fidelity mockups, refer to the project Figma workspace:
[EquiHire Design System](https://www.figma.com/design/TaOgWINAnWhxziI4Wuzbxh/EquiHire_Design?node-id=0-1&t=QUCryU1bJ3jgnGnA-1)

---

## Implementation Guidelines
- **Component Consistency:** All new components must leverage the established design tokens in the Figma workspace.
- **Data-Driven UI:** Documentation and API references (Markdown source) are intended to be rendered directly within the application's administrative views for seamless user guidance.
- **Anonymity First:** UI components must strictly adhere to the project's PII redaction protocols.
