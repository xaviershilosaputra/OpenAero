# Contributing Guide

Thank you for your interest in contributing to OpenAero. This project is an open source, MIT licensed flight tracking dashboard designed to be easy to customize, accessible by default, and framework free.

This guide explains how to contribute safely without breaking the core tracker functionality.

## What You Can Contribute

### Highly Encouraged
* Updated styling and UI/UX improvements
* New feature implementations
* Bug fixes and logic corrections
* Accessibility enhancements (A11y)
* Documentation updates
* Performance and API call optimizations

### Please Open an Issue First
* Major HTML structural changes
* Removal of existing accessibility features
* Significant JavaScript refactors or architectural shifts

## Repository Structure

/
├─ index.html          # Main dashboard semantic markup
├─ terminal.html       # CLI terminal interface
├─ js/
│  └─ script.js        # Core logic and API integration
├─ css/
│  └─ styles.css       # Global styles and glassmorphism UI
├─ CONTRIBUTING.md     # Contribution guidelines
└─ README.md           # Project overview and setup

## Project Attribution and Forking

This project is released under the MIT License. If you fork this repository, publish your own version, or create a derived project, you are permitted to change:

* Core features and tracking functionality
* Footer credit text and branding
* Repository and social links

## Testing Checklist

Before submitting a pull request, please ensure your changes meet the following criteria:

1. **Compatibility:** The update works with the existing HTML and JS architecture without breaking core API calls.
2. **Responsiveness:** The UI has been tested on mobile, tablet, and desktop breakpoints.
3. **Performance:** No significant increase in page load time or unnecessary API overhead.
4. **Code Quality:** Code remains clean, maintainable, and follows the existing functional programming style.

## Submitting a Pull Request

1. Fork the repository.
2. Create a new branch for your specific feature or fix.
3. Make focused, documented changes.
4. Open a Pull Request describing what was changed, why it was necessary, and include screenshots for any visual updates.

## Code of Conduct

All contributors are expected to be respectful, inclusive, and collaborative.

## Thank You

OpenAero is built for Avgeeks by Avgeeks. Your contributions help improve the overall user experience of this dashboard for the entire aviation community.

Happy building.