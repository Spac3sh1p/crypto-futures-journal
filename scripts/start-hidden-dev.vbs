Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectRoot = fso.GetParentFolderName(scriptDir)
powerShell = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
starter = projectRoot & "\scripts\start-hidden-dev.ps1"

command = """" & powerShell & """ -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & starter & """"
shell.Run command, 0, False
