import React, { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
// shadcn/ui imports
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Checkbox } from "./components/ui/checkbox";
import { Modal } from "./components/ui/modal";

// Single-file React demo app for BioPatch+ (Tailwind + shadcn/ui)
// Default export component

export default function BioPatchDemo() {
  const [route, setRoute] = useState("landing"); // landing | signup | login | dashboard

  // Signup form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Auth state (fake)
  const [user, setUser] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Dashboard fake health state
  const [health, setHealth] = useState({
    sbp: 110,
    dbp: 70,
    hr: 85,
    spo2: 98,
    glucose: 90,
  });

  const [history, setHistory] = useState([
    { time: timestampOffset(-30), text: "Patch initialized. Monitoring started." },
  ]);

  const [dataConsent, setDataConsent] = useState(false);
  const [detectedIssues, setDetectedIssues] = useState([]);

  // Notification modal state
  const [showNotification, setShowNotification] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef(null);
  const notificationTimerRef = useRef(null);

  // New: high heart rate states
  const [showHrNotification, setShowHrNotification] = useState(false);
  const [hrCountdown, setHrCountdown] = useState(10);
  const hrCountdownRef = useRef(null);
  const hrTimerRef = useRef(null);

  // New: low SpO₂ states
  const [showSpo2Notification, setShowSpo2Notification] = useState(false);
  const [spo2Countdown, setSpo2Countdown] = useState(10);
  const spo2CountdownRef = useRef(null);
  const spo2TimerRef = useRef(null);

  // chart data generator - last 24 hours (simplified, 24 points)
const now = new Date();
const chartData = Array.from({ length: 24 }).map((_, i) => {
  const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
  const hour = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return {
    hour,
    sbp: 105 + Math.round(Math.sin(i / 3) * 6 + Math.random() * 4),
    dbp: 70 + Math.round(Math.cos(i / 3) * 4 + Math.random() * 3),
    hr: 80 + Math.round(Math.cos(i / 4) * 8 + Math.random() * 3),
    spo2: 96 + Math.round(Math.random() * 2),
  };
});

  useEffect(() => {
    if (route === "dashboard") {
      clearTimeout(notificationTimerRef.current);
      clearTimeout(hrTimerRef.current);
      clearTimeout(spo2TimerRef.current);

      // 15s → glucose spike
      notificationTimerRef.current = setTimeout(() => {
        setHealth((h) => ({ ...h, glucose: 120 }));
        setShowNotification(true);
        setCountdown(10);

        // 15s later → high heart rate
        hrTimerRef.current = setTimeout(() => {
          setHealth((h) => ({ ...h, hr: 130 }));
          setShowHrNotification(true);
          setHrCountdown(10);

          // 15s later → low SpO₂
          spo2TimerRef.current = setTimeout(() => {
            setHealth((h) => ({ ...h, spo2: 92 }));
            setShowSpo2Notification(true);
            setSpo2Countdown(10);
          }, 15000);
        }, 15000);
      }, 15000);
    }
    return () => {
      clearTimeout(notificationTimerRef.current);
      clearTimeout(hrTimerRef.current);
      clearTimeout(spo2TimerRef.current);
    };
  }, [route]);


  function timestampOffset(minOffset = 0) {
    const t = new Date(Date.now() + minOffset * 1000);
    return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function addHistory(text) {
    setHistory((h) => [{ time: timestampOffset(0), text }, ...h].slice(0, 50));
  }

  useEffect(() => {
    if (showNotification) {
      // start countdown
      clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            // auto-approve
            handleApproveAuto();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownRef.current);
    }
    return () => clearInterval(countdownRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotification]);

  function handleApproveNow() {
    setShowNotification(false);
    setHealth((s) => ({ ...s, glucose: 90 }));
    addHistory("Insulin injected manually by user.");
  }

  function handleRejectNow() {
    setShowNotification(false);
    setDetectedIssues((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "High blood sugar detected",
        subtitle: "Patch suggests insulin release.",
      },
    ]);
    addHistory("User rejected insulin auto-injection. Added to issues list.");
  }

  function handleApproveIssue(issueId) {
    setDetectedIssues((prev) => prev.filter((i) => i.id !== issueId));
    setHealth((s) => ({ ...s, glucose: 90 }));
    addHistory("Insulin injected manually by user (from issues list).");
  }

  function handleApproveAuto() {
    // perform auto-approval action
    setShowNotification(false);
    addHistory("Insulin injected automatically at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setHealth((s) => ({ ...s, glucose: 90 }));
  }

  // Heart rate countdown effect
  useEffect(() => {
    if (showHrNotification) {
      clearInterval(hrCountdownRef.current);
      hrCountdownRef.current = setInterval(() => {
        setHrCountdown((c) => {
          if (c <= 1) {
            handleHrApproveAuto();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      clearInterval(hrCountdownRef.current);
    }
    return () => clearInterval(hrCountdownRef.current);
  }, [showHrNotification]);

  // Heart rate handlers
  function handleHrApproveNow() {
    setShowHrNotification(false);
    setHealth((s) => ({ ...s, hr: 85 }));
    addHistory("β-blocker injected manually by user.");
  }

  function handleHrRejectNow() {
    setShowHrNotification(false);
    setDetectedIssues((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "High heart rate detected",
        subtitle: "Patch suggests β-blocker release.",
      },
    ]);
    addHistory("User rejected β-blocker auto-injection. Added to issues list.");
  }

  function handleHrApproveIssue(issueId) {
    setHealth((s) => ({ ...s, hr: 85 }));
    setDetectedIssues((prev) => prev.filter((i) => i.id !== issueId));
    addHistory("β-blocker injected manually by user (from issues list).");
  }

  function handleHrApproveAuto() {
    setShowHrNotification(false);
    setHealth((s) => ({ ...s, hr: 85 }));
    addHistory(
      "β-blocker injected automatically at " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  // SpO₂ countdown effect
  useEffect(() => {
    if (showSpo2Notification) {
      clearInterval(spo2CountdownRef.current);
      spo2CountdownRef.current = setInterval(() => {
        setSpo2Countdown((c) => {
          if (c <= 1) {
            handleSpo2ApproveAuto();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      clearInterval(spo2CountdownRef.current);
    }
    return () => clearInterval(spo2CountdownRef.current);
  }, [showSpo2Notification]);

  // SpO₂ handlers
  function handleSpo2ApproveNow() {
    setShowSpo2Notification(false);
    setHealth((s) => ({ ...s, spo2: 98 }));
    addHistory("Oxygen therapy triggered manually by user.");
  }

  function handleSpo2RejectNow() {
    setShowSpo2Notification(false);
    setDetectedIssues((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "Low SpO₂ detected",
        subtitle: "Patch suggests oxygen therapy.",
      },
    ]);
    addHistory("User rejected oxygen therapy. Added to issues list.");
  }

  function handleSpo2ApproveIssue(issueId) {
    setDetectedIssues((prev) => prev.filter((i) => i.id !== issueId));
    setHealth((s) => ({ ...s, spo2: 98 }));
    addHistory("Oxygen therapy triggered manually by user (from issues list).");
  }

  function handleSpo2ApproveAuto() {
    setShowSpo2Notification(false);
    setHealth((s) => ({ ...s, spo2: 98 }));
    addHistory(
      "Oxygen therapy triggered automatically at " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }


  function handleSignup(e) {
    e?.preventDefault();
    if (!name || !email || !password || !agreed || !dataConsent) {
      alert("Please complete the form and agree to Terms & Conditions and Data Consent.");
      return;
    }
    const newUser = { name, email, password };
    setRegisteredUser(newUser);
    setUser(newUser);
    addHistory("Account created.");
    setRoute("dashboard");
  }

  function handleLogin(e) {
    e?.preventDefault();
    if (!email || !password) return alert("Enter email & password.");

    if (!registeredUser) {
      return alert("No account found. Please create an account first.");
    }

    if (registeredUser.email === email && registeredUser.password === password) {
      setUser(registeredUser);
      setRoute("dashboard");
    } else {
      alert("Invalid email or password.");
    }
  }

  function renderHero() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold">BP+</div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                BioPatch+ <span className="text-neutral-500 text-lg">— Your Health, Automated.</span>
              </h1>
            </div>
            <p className="text-neutral-600 mb-6">
              BioPatch+ is a speculative wearable patch that continuously monitors your physiology and acts when needed —
              delivering precise treatments, providing insights, and learning to keep you well.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setRoute("signup")}>Create Your Account</Button>
              <Button variant="outline" onClick={() => setRoute("login")}>Log in</Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-[400px] h-[400px] rounded-2xl shadow-xl bg-white flex flex-col items-center justify-center p-6">
              <svg width="220" height="220" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="108" height="108" rx="18" fill="#eef2ff" stroke="#c7d2fe" />
                <circle cx="60" cy="50" r="25" fill="#eef" stroke="#a78bfa" />
                <rect x="35" y="80" width="50" height="12" rx="3" fill="#dbeafe" />
              </svg>
              <div className="mt-4 text-center text-sm text-neutral-600">BioPatch+ prototype — smart monitoring patch</div>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-4 left-4 text-xs text-neutral-500">
          BioPatch+ uses anonymized data to improve global health predictions. By using this service, you agree to continuous monitoring.
        </footer>
      </div>
    );
  }


  function renderSignup() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                <div className="flex items-center gap-2">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <label className="text-sm text-neutral-700">I agree to the <button type="button" className="underline" onClick={() => setShowTerms(true)}>Terms & Conditions</button></label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox checked={dataConsent} onCheckedChange={(v) => setDataConsent(!!v)} />
                  <label className="text-sm text-neutral-700">By creating an account, you consent to BioPatch+ storing your biological data for research and product improvement. Data may be shared with our partners to enhance predictive health recommendations.</label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Account</Button>
                  <Button variant="outline" onClick={() => setRoute("landing")}>Cancel</Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Terms modal */}
        {showTerms && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Terms & Conditions for BioPatch+</h3>

              <div className="text-sm text-neutral-700 mb-4 max-h-[400px] overflow-auto pr-2">
                <p>
                  Effective Date: September 18, 2025
                </p>
                <p>
                  1. Acceptance of Terms<br/>
                  By accessing or using BioPatch+, including any related websites, applications, and services (collectively, "the Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you must not use the Service.
                </p>
                <p>
                  2. Account Registration<br/>
                  You must provide accurate, complete, and current information when registering an account. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                <p>
                  3. Use of the Service<br/>
                  The Service is intended for informational and experimental purposes only. BioPatch+ does not provide medical advice, diagnosis, or treatment. You should always consult a qualified healthcare professional regarding any medical concerns.
                </p>
                <p>
                  4. Data Collection and Consent<br/>
                  By creating an account and using the Service, you consent to BioPatch+ collecting, storing, processing, and analyzing your physiological and biological data, including but not limited to heart rate, blood pressure, oxygen saturation, glucose levels, and other sensor-derived metrics. This data may be used for research, product improvement, analytics, and predictive health modeling.
                </p>
                <p>
                  5. Data Sharing<br/>
                  Data may be shared with BioPatch+ partners, affiliates, contractors, and research collaborators, provided that personally identifiable information is anonymized or pseudonymized wherever feasible. Shared data may be used to develop, refine, and enhance predictive algorithms, health insights, and global research initiatives.
                </p>
                <p>
                  6. User Responsibilities<br/>
                  You agree to use the Service responsibly and not engage in any activity that could harm the Service, other users, or BioPatch+. This includes, without limitation, attempting to reverse engineer software components, tampering with hardware devices, or interfering with system operations.
                </p>
                <p>
                  7. Limitations of Liability<br/>
                  To the fullest extent permitted by applicable law, BioPatch+ and its affiliates, officers, directors, employees, and agents shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from your use of the Service, including any inaccuracies in health data, delays, or interruptions.
                </p>
                <p>
                  8. Health Disclaimer<br/>
                  The Service is not a substitute for professional medical care. You acknowledge and agree that any health insights, alerts, or automated actions generated by the Service are provided for informational purposes only and should not replace consultation with a healthcare provider.
                </p>
                <p>
                  9. Intellectual Property<br/>
                  All content, graphics, software, trademarks, logos, and other materials provided by the Service are the property of BioPatch+ or its licensors and are protected by copyright, trademark, and other intellectual property laws. Users may not reproduce, distribute, or create derivative works without explicit written permission.
                </p>
                <p>
                  10. Termination<br/>
                  BioPatch+ reserves the right, in its sole discretion, to suspend or terminate your access to the Service for any reason, including violation of these Terms, at any time without notice. Upon termination, your right to use the Service immediately ceases.
                </p>
                <p>
                  11. Modifications<br/>
                  BioPatch+ may revise these Terms at any time. Updated Terms will be effective upon posting. Continued use of the Service constitutes your acceptance of the revised Terms.
                </p>
                <p>
                  12. Governing Law<br/>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which BioPatch+ operates, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the appropriate courts within that jurisdiction.
                </p>
                <p>
                  13. Entire Agreement<br/>
                  These Terms constitute the entire agreement between you and BioPatch+ regarding the use of the Service and supersede all prior or contemporaneous communications, proposals, and representations.
                </p>
                <p>
                  14. Contact Information<br/>
                  For questions or concerns regarding these Terms, please contact support@biopatchplus.com.
                </p>
                <p>
                  By checking "I agree," you acknowledge that you have read, understood, and accepted these Terms & Conditions in their entirety. Your continued use of the Service constitutes ongoing acceptance of these Terms.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setShowTerms(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  function renderLogin() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                <div className="flex gap-2">
                  <Button type="submit">Log in</Button>
                  <Button variant="outline" onClick={() => setRoute("landing")}>Back</Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="min-h-screen bg-white p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-white font-bold">BP+</div>
            <div>
              <div className="text-sm text-neutral-500">Welcome back,</div>
              <div className="font-semibold">{user?.name || "Demo User"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { setUser(null); setRoute("landing"); }}>Sign out</Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="SBP" value={`${health.sbp} mmHg`} status={health.sbp < 130 ? "green" : "red"} />
                  <Stat label="DBP" value={`${health.dbp} mmHg`} status={health.dbp < 90 ? "green" : "red"} />
                  <Stat label="Heart Rate" value={`${health.hr} bpm`} status={health.hr < 100 ? "green" : "red"} />
                  <Stat label="SpO₂" value={`${health.spo2}%`} status={health.spo2 >= 95 ? "green" : "yellow"} />
                  <Stat label="Glucose" value={`${health.glucose} mg/dL`} status={health.glucose < 120 ? "green" : "red"} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {detectedIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="flex items-start justify-between bg-slate-50 p-3 rounded"
                    >
                      <div>
                        <div className="text-sm font-semibold">{issue.title}</div>
                        <div className="text-xs text-neutral-600">{issue.subtitle}</div>
                      </div>
                      <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (issue.title === "High blood sugar detected") {
                            handleApproveIssue(issue.id);
                          } else if (issue.title === "High heart rate detected") {
                            handleHrApproveIssue(issue.id);
                          } else if (issue.title === "Low SpO₂ detected") {
                            handleSpo2ApproveIssue(issue.id);
                          }
                        }}
                      >
                        Approve
                      </Button>

                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Insights (24h)</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="sbp" stroke="#ff0000" dot={false} name="SBP" />
                    <Line type="monotone" dataKey="dbp" stroke="#0000ff" dot={false} name="DBP" />
                    <Line type="monotone" dataKey="hr" stroke="#82ca9d" dot={false} name="HR" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-auto space-y-2 text-sm text-neutral-700">
                  {history.map((h, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded">
                      <div className="text-xs text-neutral-500">{h.time}</div>
                      <div>{h.text}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions (Under Development)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => addHistory("User requested patch diagnostics.")}>Run Diagnostics</Button>
                  <Button variant="outline" onClick={() => addHistory("User exported last 24h of anonymized data.")}>Export Data (anonymized)</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>

        {/* Notification modal */}
        {showNotification && (
          <div className="fixed inset-0 flex items-end justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-lg p-4 border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">⚠️ High blood sugar detected.</div>
                  <div className="text-xs text-neutral-600">Auto-injection in {countdown}s</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleApproveNow}>Approve Now</Button>
                  <Button variant="destructive" onClick={handleRejectNow}>Reject</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heart rate notification modal */}
        {showHrNotification && (
          <div className="fixed inset-0 flex items-end justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-lg p-4 border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">⚠️ High heart rate detected.</div>
                  <div className="text-xs text-neutral-600">Auto-injection in {hrCountdown}s</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleHrApproveNow}>Approve Now</Button>
                  <Button variant="destructive" onClick={handleHrRejectNow}>Reject</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SpO₂ notification modal */}
        {showSpo2Notification && (
          <div className="fixed inset-0 flex items-end justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-lg p-4 border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">⚠️ Low oxygen level detected.</div>
                  <div className="text-xs text-neutral-600">Auto-therapy in {spo2Countdown}s</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSpo2ApproveNow}>Approve Now</Button>
                  <Button variant="destructive" onClick={handleSpo2RejectNow}>Reject</Button>
                </div>
              </div>
            </div>
          </div>
        )}


        <footer className="mt-8 text-sm text-neutral-500">By using this demo you agree to continuous monitoring for research purposes.</footer>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900">
      {route === "landing" && renderHero()}
      {route === "signup" && renderSignup()}
      {route === "login" && renderLogin()}
      {route === "dashboard" && renderDashboard()}
    </div>
  );
}

// Small helper component for stat tiles
function Stat({ label, value, status = "green" }) {
  const color = status === "green" ? "bg-green-50 text-green-700" : status === "yellow" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700";
  return (
    <div className={`p-3 rounded ${color}`}>
      <div className="text-xs">{label}</div>
      <div className="font-semibold text-lg">{value}</div>
    </div>
  );
}
