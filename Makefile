.PHONY: agent-status agent-start agent-help

agent-status:
	@./agent status

agent-start:
	@./agent start

agent-send:
	@echo "Usage: make agent-send AGENT=<agent> MSG='<message>'"
	@echo "Example: make agent-send AGENT=po MSG='Add user login feature'"

agent-logs:
	@echo "Usage: make agent-logs AGENT=<agent>"
	@echo "Example: make agent-logs AGENT=frontend"

agent-reset:
	@echo "Usage: make agent-reset AGENT=<agent>"
	@echo "Example: make agent-reset AGENT=backend"

agent-help:
	@./agent help
