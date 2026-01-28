# Contributing to Homebox Label Studio

Thank you for your interest in contributing to the Homebox Label Studio project!

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Docker and Docker Compose (for testing the full setup)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gorick1/homebox-label-studio.git
   cd homebox-label-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Visit http://localhost:5173

### Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

## Docker Development

### Build and run label designer only:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Build and run full stack:
```bash
# Requires homebox-companion and homebox-print-addon repos cloned as siblings
./install.sh
```

## Project Structure

```
homebox-label-studio/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Documentation
├── docker-compose.yml     # Full stack orchestration
├── docker-compose.dev.yml # Dev-only compose
├── Dockerfile            # Container build instructions
└── nginx.conf            # Production web server config
```

## Making Changes

### Code Style

- Follow existing code style and conventions
- Use TypeScript for type safety
- Use functional React components with hooks
- Use Tailwind CSS for styling

### Component Guidelines

- Keep components small and focused
- Use shadcn-ui components where possible
- Document complex logic with comments
- Write descriptive prop types

### Commit Messages

Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add label preview functionality
fix: correct alignment in print template
docs: update installation instructions
```

### Pull Request Process

1. **Fork the repository**

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Write clean, documented code
   - Add tests if applicable
   - Update documentation

4. **Test your changes:**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request:**
   - Go to GitHub and create a PR
   - Describe your changes clearly
   - Reference any related issues

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No unnecessary dependencies added
- [ ] Build passes successfully
- [ ] Tested with Docker setup

## Areas for Contribution

### High Priority
- Label template designer UI improvements
- Additional label format support (PDF, ZPL, etc.)
- Print preview functionality
- Template import/export
- Better error handling and user feedback

### Medium Priority
- Additional printer support (non-DYMO)
- Template library/marketplace
- Batch printing features
- Advanced template editor (drag-and-drop)
- Mobile-responsive improvements

### Documentation
- Tutorial videos
- More example templates
- Troubleshooting guides
- API documentation

## Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check docs/ folder for guides

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

Feel free to open an issue or discussion if you have any questions about contributing!
