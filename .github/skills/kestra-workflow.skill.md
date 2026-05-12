# Kestra Workflow Skill

## Overview
Skill for authoring Kestra workflow YAML files for the Vid2Tweet project.

## Key Patterns

### Shell Commands Task
```yaml
- id: my_task
  type: io.kestra.plugin.scripts.shell.Commands
  containerImage: "python:3.11-slim"
  beforeCommands:
    - pip install yt-dlp --quiet
  commands:
    - echo "Hello"
  outputFiles:
    - output.txt
```

### Python Script Task
```yaml
- id: my_python_task
  type: io.kestra.plugin.scripts.python.Script
  containerImage: "python:3.11-slim"
  inputFiles:
    input.txt: "{{ outputs.prev_task.outputFiles['input.txt'] }}"
  script: |
    with open("output.txt", "w") as f:
        f.write("result")
  outputFiles:
    - output.txt
```

### Secrets
Use `{{ secret('KEY_NAME') }}` — resolved from SECRET_KEY_NAME env var.

### File Passing
- `outputFiles`: list filenames in working directory
- `inputFiles`: map filename → Kestra internal URI from previous task
