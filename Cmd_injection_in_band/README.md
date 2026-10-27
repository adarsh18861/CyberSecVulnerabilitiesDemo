# Cyber Security (IT-30001) - Web Server Security Assignment
**Indian Institute of Information Technology Allahabad (Autumn Semester 2026)**  
**Instructor:** Dr. Soumyadev Maity

---

## Table 3: Ownership Declaration

| Member Name | Roll Number | Category | Variant Implemented |
|---|---|---|---|
| [Your Name] | [Your Roll No] | OS Command Injection | Variant 1: In-band (command output returned) |
| [Member 2] | [Roll No 2] | SQL Injection | [Variant Selected] |
| [Member 3] | [Roll No 3] | Cross-Site Scripting (XSS) | [Variant Selected] |
| [Member 4] | [Roll No 4] | Cross-Site Request Forgery (CSRF) | [Variant Selected] |

---

## Variant 1 Overview: OS Command Injection (In-band)

### (a) Vulnerable Implementation
The route `/vulnerable` accepts a target host/IP address via POST parameter `target` and constructs a system shell command using string interpolation:
```python
cmd = f"ping -c 1 {target}"
output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
```

### (b) Working Exploit Payload
* **Payload:** `127.0.0.1; whoami; id`
* **cURL Command:**
  ```bash
  curl -X POST http://127.0.0.1:5000/vulnerable -d "target=127.0.0.1; whoami; id"
  ```
* **Output:**
  ```text
  PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.
  64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.030 ms

  --- 127.0.0.1 ping statistics ---
  1 packets transmitted, 1 received, 0% packet loss, time 0ms
  rtt min/avg/max/mdev = 0.030/0.030/0.030/0.000 ms
  username
  uid=1000(username) gid=1000(username) groups=1000(username)
  ```

### (c) Root Cause
User input is concatenated directly into a system command string and passed to `/bin/sh` via `shell=True`. Metacharacters like `;`, `&&`, or `|` allow an attacker to inject arbitrary OS commands that execute within the web server's privilege context.

### (d) Implemented Mitigation
The route `/mitigated` replaces shell string execution with an **Argument Vector** (list of arguments) and keeps `shell=False`:
```python
cmd = ["ping", "-c", "1", target]
output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
```
When tested with the same exploit payload (`127.0.0.1; whoami; id`), the operating system treats the entire injected payload string as a single argument (literal hostname) passed to `ping`, safely blocking command execution:
```bash
curl -X POST http://127.0.0.1:5000/mitigated -d "target=127.0.0.1; whoami; id"
# Output: ping: 127.0.0.1; whoami; id: Name or service not known
```

### (e) Other Mitigation Alternatives (Theory)
1. **Avoid the Shell Entirely:** Use native language APIs or standard libraries (e.g., Python `socket` module) rather than executing external system binary commands.
2. **Input Validation (Allow-listing):** Validate input against a strict regular expression pattern (e.g., matching only valid IPv4/IPv6 address strings or domain formats) before processing.
3. **Principle of Least Privilege:** Run the web application service under an isolated, low-privileged user account with restricted binary execution permissions to limit post-exploitation capabilities.

---

## How to Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Start the application:**
   ```bash
   python app.py
   ```
3. **Run automated test script:**
   ```bash
   chmod +x test_exploit.sh
   ./test_exploit.sh
   ```
