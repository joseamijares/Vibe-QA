# Claude Code Integration Guide

This document explains how the `code-quality-guardian` agent is integrated into the VibeQA development workflow.

## Overview

The code-quality-guardian agent is configured to run automatically:
1. **After code changes** - When you edit files in Claude Code
2. **Before commits** - Through git pre-commit hooks and npm scripts

## Configuration Structure

```
.claude/
├── settings.json       # Hooks configuration
├── hooks/
│   └── run-quality-check.sh  # Script to invoke quality checks
└── agents/            # Project-specific agents (if needed)
```

## How It Works

### 1. Claude Code Hooks
When you edit files in Claude Code, the PostToolUse hooks automatically trigger the code-quality-guardian agent:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/run-quality-check.sh"
          }
        ]
      }
    ]
  }
}
```

### 2. Pre-commit Workflow
The quality checks run automatically before each commit through:

- **npm script**: `npm run precommit` runs formatting, type checking, and the quality guardian
- **Git hook**: `.git/hooks/pre-commit` automatically runs the npm precommit script

### 3. Quality Check Script
The `run-quality-check.sh` script:
- Detects if running inside Claude Code
- Falls back to standard checks (format + typecheck) when Claude CLI isn't available
- Provides clear feedback about the checks being performed

## Usage

### Manual Quality Check
```bash
npm run precommit
```

### Bypass Checks (Not Recommended)
```bash
git commit --no-verify
```

### Run Agent Directly in Claude Code
When working in Claude Code, you can manually invoke the agent:
```
/agents code-quality-guardian
```

## What Gets Checked

The code-quality-guardian agent reviews:
- Code quality issues
- Potential bugs
- Adherence to project standards
- TypeScript type errors
- Code style violations
- Performance concerns
- Security issues

## Troubleshooting

### "Claude CLI not found" Message
This is normal when running outside Claude Code. The script falls back to standard checks (formatting and TypeScript).

### Checks Taking Too Long
The script has built-in timeouts. If checks are slow, ensure:
- Node modules are installed (`npm install`)
- TypeScript configuration is correct
- No infinite loops in code

### Skipping Checks
While you can skip checks with `--no-verify`, it's strongly discouraged. Fix issues before committing to maintain code quality.

## Maintenance

To update the quality checks:
1. Modify `.claude/hooks/run-quality-check.sh` for the check logic
2. Update `.claude/settings.json` to change when hooks trigger
3. Update `package.json` precommit script for additional npm checks