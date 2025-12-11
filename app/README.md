# Application Directory

This is where your application code lives.

## Getting Started

Replace the contents of this directory with your application. The ADW system will:

1. Read your codebase to understand the structure
2. Generate implementation plans based on GitHub issues
3. Make changes to files in this directory
4. Run tests defined in your test suite

## Recommended Structure

```
app/
├── src/                    # Source code
│   ├── components/         # UI components (if applicable)
│   ├── lib/                # Utilities and helpers
│   ├── pages/              # Pages or routes
│   └── ...
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   └── e2e/                # E2E tests
├── package.json            # Dependencies
└── README.md               # App-specific documentation
```

## Integration with ADW

For ADW to work effectively with your app:

1. **Document your app** - Create a README explaining the structure
2. **Define test commands** - ADW uses these to verify changes
3. **Use consistent patterns** - Makes it easier for AI to understand

## Tips

- Keep your `/prime` command updated with key files to read
- Add E2E test specs in `.claude/commands/e2e/`
- Use clear file and function naming
