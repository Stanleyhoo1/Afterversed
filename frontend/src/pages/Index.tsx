import { ChangeEvent, FormEvent, useState } from "react";

const Index = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === "success") {
      setStatus("idle");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("Contact form submitted:", formData);
    setStatus("success");
    setFormData({
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
        style={{
          background: 'linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))',
        }}
      />
      
      {/* Sun-like glow from top-right */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(45, 95%, 60%) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </header>

          {/* Form Container */}
          <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 px-6 py-8 md:px-10 md:py-12"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                  Full name
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                  Email address
                  <input
                    required
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ada@example.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                  Company
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Analytical Engines Inc."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 20 7946 0958"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                How can we help?
                <textarea
                  required
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Share a few details about your project or question."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </label>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {status === "success" && (
                  <p className="text-sm font-medium text-emerald-500">
                    Thanks for reaching out! We&apos;ll be in touch soon.
                  </p>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Send message
                </button>
              </div>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Your information is safe with us and will never be shared
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
