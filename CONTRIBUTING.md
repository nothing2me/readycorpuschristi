# Contributing to ReadyCorpusChristi

Thank you for your interest in contributing to ReadyCorpusChristi! This document provides guidelines and instructions for contributors.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Create a branch** for your feature/fix: `git checkout -b feature/your-feature-name`
3. **Set up your environment** (see README.md for setup instructions)
4. **Make your changes** following the code style guidelines below
5. **Test your changes** to ensure everything works
6. **Commit your changes** with clear, descriptive commit messages
7. **Push to your fork** and create a Pull Request

## Code Style

- **Python**: Follow PEP 8 style guidelines
- **JavaScript**: Use modern ES6+ syntax, consistent indentation
- **HTML/CSS**: Use consistent formatting, semantic HTML
- **Comments**: Add docstrings to functions/classes, explain complex logic

## Project Structure

```
readycorpuschristi/
├── app.py                 # Main Flask application entry point
├── routes/                # API route handlers (blueprints)
├── services/              # Business logic and service layers
├── static/                # Static assets (CSS, JS, images)
├── templates/             # HTML templates
├── scripts/               # Utility scripts
└── tests/                 # Unit and integration tests (when added)
```

## Commit Messages

Use clear, descriptive commit messages:
- `feat: Add new feature description`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Code refactoring description`
- `style: Code style changes`
- `test: Add or update tests`

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update documentation as needed
3. Add tests if applicable
4. Ensure all tests pass
5. Create a clear PR description explaining your changes
6. Wait for code review and address any feedback

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)
- Screenshots if applicable

## Questions?

Feel free to open an issue for questions or clarifications!

