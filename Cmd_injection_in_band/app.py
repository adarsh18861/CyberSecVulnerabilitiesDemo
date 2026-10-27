import sys
import subprocess
from flask import Flask, request, render_template_string

app = Flask(__name__)

# Detect OS and select correct ping count flag ('-n' for Windows, '-c' for Linux/Mac)
PING_FLAG = "-n" if sys.platform.startswith("win") else "-c"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        input[type=text] { width: 350px; padding: 8px; }
        input[type=submit] { padding: 8px 15px; }
        pre { background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div style="margin-bottom: 15px;"><a href="/">&larr; Home</a></div>
    <h2>{{ title }}</h2>
    <form method="POST">
        <label>Enter Host/IP to Ping:</label><br><br>
        <input type="text" name="target" placeholder="e.g., 127.0.0.1" value="{{ target }}" required>
        <input type="submit" value="Run Ping">
    </form>
    {% if output %}
    <h3>Command Output:</h3>
    <pre>{{ output }}</pre>
    {% endif %}
</body>
</html>
"""

INDEX_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>OS Command Injection Demo</title></head>
<body style="font-family: Arial; margin: 40px;">
    <h1>Web Server Security Assignment</h1>
    <h3>OS Command Injection (Variant 1: In-band)</h3>
    <ul>
        <li><a href="/vulnerable">Vulnerable Endpoint (/vulnerable)</a></li>
        <li><a href="/mitigated">Mitigated Endpoint (/mitigated)</a></li>
    </ul>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(INDEX_TEMPLATE)

# (a) VULNERABLE IMPLEMENTATION
@app.route('/vulnerable', methods=['GET', 'POST'])
def vulnerable_ping():
    output = ""
    target = ""
    if request.method == 'POST':
        target = request.form.get('target', '')
        # Vulnerable string concatenation passed to shell
        cmd = f"ping {PING_FLAG} 1 {target}"
        try:
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
        except subprocess.CalledProcessError as e:
            output = e.output
        except Exception as e:
            output = str(e)
    return render_template_string(HTML_TEMPLATE, output=output, target=target, title="Vulnerable Ping Utility")

# (d) MITIGATED IMPLEMENTATION
@app.route('/mitigated', methods=['GET', 'POST'])
def mitigated_ping():
    output = ""
    target = ""
    if request.method == 'POST':
        target = request.form.get('target', '')
        # Parameterized execution (Argument vector with shell=False)
        cmd = ["ping", PING_FLAG, "1", target]
        try:
            output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
        except subprocess.CalledProcessError as e:
            output = e.output
        except Exception as e:
            output = str(e)
    return render_template_string(HTML_TEMPLATE, output=output, target=target, title="Mitigated Ping Utility")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)