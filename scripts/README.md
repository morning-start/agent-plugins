# Evaluation scripts

Evaluation outputs belong in the ignored `workspace/` directory and must not be committed.

```text
workspace/
└── iteration-N/
    └── eval-ID/
```

Clean local results before a new run when needed:

```bash
rm -rf workspace/
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force workspace
```

Keep durable test prompts and assertions in `evals/evals.json`; keep generated outputs in `workspace/` only.
