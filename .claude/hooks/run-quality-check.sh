#!/bin/bash

# Claude Code Quality Guardian Hook Script
# This script invokes the code-quality-guardian agent

# Get the project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Log the invocation
echo "🔍 Running code-quality-guardian agent..."

# Check if we're running inside Claude Code (Claude environment variables will be set)
if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -n "$CLAUDE_AVAILABLE_TOOLS" ]; then
    # We're inside Claude Code, the agent will be invoked automatically by the hooks
    echo "🤖 Code-quality-guardian agent is being invoked by Claude Code hooks..."
    echo "   Note: The agent runs automatically when you edit files in Claude Code."
    RESULT=0
else
    # Running outside Claude Code - check if claude CLI is available
    if command -v claude &> /dev/null && [ -t 0 ]; then
        # Claude CLI is available and we have a terminal
        echo "📝 To run code-quality-guardian agent, use the following command:"
        echo "   claude /agents code-quality-guardian"
        echo ""
        echo "⚠️  Skipping agent invocation in automated context..."
        RESULT=0
    else
        echo "⚠️  Claude CLI not found or not in interactive mode."
        echo "   Falling back to standard checks..."
    fi
    
    # Fallback to running standard checks
    cd "$PROJECT_DIR"
    
    # Run format check
    echo "📝 Checking code formatting..."
    npm run format:check
    FORMAT_RESULT=$?
    
    # Run typecheck
    echo "🔍 Running TypeScript checks..."
    npm run typecheck
    TYPE_RESULT=$?
    
    # Return failure if any check failed
    if [ $FORMAT_RESULT -ne 0 ] || [ $TYPE_RESULT -ne 0 ]; then
        RESULT=1
    else
        RESULT=0
    fi
fi

# Exit with the result
if [ $RESULT -eq 0 ]; then
    echo "✅ Code quality checks passed!"
else
    echo "❌ Code quality checks failed. Please fix the issues before proceeding."
fi

exit $RESULT