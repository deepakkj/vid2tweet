# Contributing to Vid2Tweet

We welcome contributions! Whether it's a bug fix, a new feature, or improving documentation, here's how you can help.

## Adding New Agent Tasks

Vid2Tweet is designed around Kestra workflows. To add a new capability (e.g., generating LinkedIn posts):

1.  **Create a sub-flow**: Add a new YAML file in `kestra/workflows/tasks/` for the specific agent logic.
2.  **Integrate into the main pipeline**: Update `kestra/workflows/content-pipeline.yml` to include the new task.
3.  **Update the frontend**: Add UI elements in `frontend/src/app/` to display or interact with the new output.
4.  **Test locally**: Run `./scripts/deploy-flows.sh` and trigger a test execution.

## Code Style Guidelines

- **DRY (Don't Repeat Yourself)**: If you find yourself copying Kestra task logic, consider moving it to a sub-flow or a shared script.
- **SOLID**: Keep each Kestra task focused on a single responsibility.
- **KISS (Keep It Simple, Stupid)**: This is a hackathon-scale project. Favor readability and maintainability over complex abstractions.
- **YAGNI (You Ain't Gonna Need It)**: Don't implement features "just in case." Focus on the current roadmap goals.

## Project Structure

- `kestra/workflows/`: Main workflow definitions.
- `frontend/src/app/`: Next.js pages and components.
- `frontend/src/lib/`: API clients and shared utilities.
- `scripts/`: Deployment and helper scripts.

## Pull Request Process

1.  **Branching**: Create a feature branch from `main`.
2.  **Commits**: Use clear, descriptive commit messages.
3.  **Verification**: Ensure `podman compose up` works and the frontend builds without errors.
4.  **Documentation**: Update relevant `.md` files in `docs/` if your changes affect architecture or setup.
5.  **Submit**: Open a PR and describe your changes clearly.
