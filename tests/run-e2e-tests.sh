#!/bin/bash

# Prompt Driver Bookmark System E2E Test Runner
# This script sets up the environment and runs comprehensive E2E tests

set -e  # Exit on any error

echo "🚀 Starting Prompt Driver Bookmark System E2E Tests"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi

    # Check Java (for Spring Boot backend)
    if ! command -v java &> /dev/null; then
        print_error "Java is required but not installed"
        exit 1
    fi

    # Check Gradle
    if ! command -v gradle &> /dev/null && [ ! -f "../gradlew" ]; then
        print_error "Gradle or gradlew is required but not found"
        exit 1
    fi

    print_success "All requirements satisfied"
}

# Setup test environment
setup_environment() {
    print_status "Setting up test environment..."

    # Install E2E test dependencies
    print_status "Installing E2E test dependencies..."
    npm install

    # Install Playwright browsers
    print_status "Installing Playwright browsers..."
    npx playwright install

    # Setup frontend dependencies
    print_status "Setting up frontend dependencies..."
    cd ../frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ../tests

    print_success "Environment setup complete"
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."

    cd ..

    # Use gradlew if available, otherwise use gradle
    if [ -f "./gradlew" ]; then
        GRADLE_CMD="./gradlew"
    else
        GRADLE_CMD="gradle"
    fi

    # Start backend in test mode
    $GRADLE_CMD bootRun --args="--spring.profiles.active=test" > backend.log 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to start
    print_status "Waiting for backend to be ready..."
    for i in {1..60}; do
        if curl -s http://localhost:9090/actuator/health > /dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "Backend failed to start within 60 seconds"
            cat backend.log
            exit 1
        fi
        sleep 1
    done

    cd tests
}

# Start frontend server
start_frontend() {
    print_status "Starting frontend server..."

    cd ../frontend

    # Start frontend in development mode
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to start
    print_status "Waiting for frontend to be ready..."
    for i in {1..60}; do
        if curl -s http://localhost:4000 > /dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "Frontend failed to start within 60 seconds"
            cat ../frontend.log
            exit 1
        fi
        sleep 1
    done

    cd ../tests
}

# Run E2E tests
run_tests() {
    print_status "Running E2E tests..."

    # Set test environment variables
    export NODE_ENV=test
    export PLAYWRIGHT_BASE_URL=http://localhost:4000
    export BACKEND_BASE_URL=http://localhost:9090

    # Run the tests
    if [ "$1" = "--headed" ]; then
        print_status "Running tests in headed mode..."
        npx playwright test --headed
    elif [ "$1" = "--debug" ]; then
        print_status "Running tests in debug mode..."
        npx playwright test --debug
    elif [ "$1" = "--ui" ]; then
        print_status "Running tests with UI..."
        npx playwright test --ui
    else
        print_status "Running tests in headless mode..."
        npx playwright test
    fi

    TEST_EXIT_CODE=$?

    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_success "All tests passed! 🎉"
    else
        print_error "Some tests failed"
    fi

    return $TEST_EXIT_CODE
}

# Cleanup processes
cleanup() {
    print_status "Cleaning up..."

    # Kill backend if running
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi

    # Kill frontend if running
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi

    # Kill any remaining processes on the ports
    lsof -ti:9090 | xargs kill -9 2>/dev/null || true
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true

    print_success "Cleanup complete"
}

# Generate test report
generate_report() {
    print_status "Generating test report..."

    if [ -f "test-results.json" ]; then
        print_status "Test results available in test-results.json"
    fi

    if [ -d "playwright-report" ]; then
        print_status "HTML report available at playwright-report/index.html"
        print_status "To view the report, run: npx playwright show-report"
    fi

    if [ -d "test-results" ]; then
        print_status "Detailed test results available in test-results/ directory"
    fi
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    echo "Starting at $(date)"

    # Parse command line arguments
    RUN_MODE="headless"
    if [ "$1" = "--headed" ] || [ "$1" = "--debug" ] || [ "$1" = "--ui" ]; then
        RUN_MODE="$1"
    fi

    # Run all steps
    check_requirements
    setup_environment
    start_backend
    start_frontend

    # Run tests and capture exit code
    if run_tests "$RUN_MODE"; then
        print_success "🎉 All Bookmark System E2E tests completed successfully!"
        FINAL_EXIT_CODE=0
    else
        print_error "❌ Some tests failed. Check the reports for details."
        FINAL_EXIT_CODE=1
    fi

    generate_report

    echo ""
    echo "=================================================="
    echo "E2E Test Run Complete at $(date)"
    echo "=================================================="

    exit $FINAL_EXIT_CODE
}

# Run main function with all arguments
main "$@"