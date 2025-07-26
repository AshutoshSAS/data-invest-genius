import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/landing/AnimatedBackground";
import ThreeDCard from "@/components/landing/ThreeDCard";
import FeatureCard from "@/components/landing/FeatureCard";
import Cube3D from "@/components/landing/Cube3D";
import ParticleAnimation from "@/components/landing/ParticleAnimation";

const Landing = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 3D Animated Background */}
        <AnimatedBackground />

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-6">
                Transform Investment Research with AI
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-xl text-muted-foreground mb-8">
                ResearchGenius helps investment teams organize, analyze, and extract insights from research documents using advanced AI.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => {
                  const demoSection = document.getElementById("features");
                  demoSection?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See Features
              </Button>
            </motion.div>
          </div>

          {/* 3D Floating Document Illustration */}
          <div className="relative mx-auto mt-16 max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* 3D Cube (left side) */}
            <motion.div
              className="hidden lg:flex justify-center items-center lg:col-span-1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.5 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <Cube3D size={150} />
            </motion.div>
            
            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 40 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="lg:col-span-3"
            >
              <ThreeDCard className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ 
                    rotateX: [0, 2, 0, -2, 0], 
                    rotateY: [0, 3, 0, -3, 0] 
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  <img 
                    src="/dashboard-preview.png" 
                    alt="ResearchGenius Dashboard" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/1200x675?text=ResearchGenius+Dashboard";
                    }}
                  />
                </motion.div>
              </ThreeDCard>
            </motion.div>
            
            {/* 3D Cube (right side) */}
            <motion.div
              className="hidden lg:flex justify-center items-center lg:col-span-1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.5 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <Cube3D size={150} color="blue" />
            </motion.div>
            
            {/* Floating Elements */}
            {[
              { top: "10%", left: "-5%", delay: 1.2, icon: "📊" },
              { top: "20%", right: "-3%", delay: 1.5, icon: "🔍" },
              { bottom: "15%", left: "10%", delay: 1.8, icon: "📈" },
              { bottom: "25%", right: "8%", delay: 2.1, icon: "🤖" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="absolute bg-background rounded-full p-4 shadow-lg"
                style={{
                  top: item.top || "auto",
                  left: item.left || "auto",
                  right: item.right || "auto",
                  bottom: item.bottom || "auto",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.5 }}
                transition={{ duration: 0.6, delay: item.delay }}
              >
                <div className="text-3xl">{item.icon}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to streamline your investment research workflow
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI Document Analysis",
                description: "Automatically extract key insights, metrics, and sentiment from research documents.",
                icon: "🤖",
                delay: 0.2,
              },
              {
                title: "Intelligent Search",
                description: "Find exactly what you need with semantic search across all your research materials.",
                icon: "🔍",
                delay: 0.4,
              },
              {
                title: "Research Chat",
                description: "Ask questions about your documents and get AI-powered answers with source citations.",
                icon: "💬",
                delay: 0.6,
              },
              {
                title: "Team Collaboration",
                description: "Share insights, collaborate on projects, and manage team access seamlessly.",
                icon: "👥",
                delay: 0.8,
              },
              {
                title: "Project Management",
                description: "Organize research by projects, themes, or investment theses for better focus.",
                icon: "📋",
                delay: 1.0,
              },
              {
                title: "Advanced Analytics",
                description: "Track research activity, popular documents, and team engagement with detailed analytics.",
                icon: "📊",
                delay: 1.2,
              },
            ].map((feature, i) => (
              <FeatureCard
                key={i}
                icon={<div className="text-4xl">{feature.icon}</div>}
                title={feature.title}
                description={feature.description}
                delay={feature.delay}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Investment Teams</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how ResearchGenius is transforming investment research workflows
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "ResearchGenius has cut our research analysis time by 60%. The AI insights are remarkably accurate.",
                author: "Sarah Chen",
                role: "Research Director, Global Capital Partners",
                delay: 0.3,
              },
              {
                quote: "The semantic search and document chat features have transformed how we access our research knowledge base.",
                author: "Michael Rodriguez",
                role: "Senior Analyst, Horizon Investments",
                delay: 0.5,
              },
              {
                quote: "Team collaboration has never been easier. We can now share insights and build on each other's research seamlessly.",
                author: "Jessica Wong",
                role: "Portfolio Manager, Evergreen Assets",
                delay: 0.7,
              },
            ].map((testimonial, i) => (
              <ThreeDCard
                key={i}
                className="bg-background rounded-xl p-6 shadow-sm border border-border h-full"
                glareIntensity={0.1}
                rotationIntensity={5}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: testimonial.delay }}
                >
                  <div className="mb-4 text-2xl">⭐⭐⭐⭐⭐</div>
                  <p className="italic mb-6 text-muted-foreground">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </motion.div>
              </ThreeDCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 to-blue-500/10 relative overflow-hidden">
        <AnimatedBackground className="opacity-50" />
        <ParticleAnimation className="opacity-30" particleCount={30} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Investment Research?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join leading investment teams already using ResearchGenius to gain a competitive edge.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started Today
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                ResearchGenius
              </h3>
              <p className="text-muted-foreground mt-2">
                AI-powered research management for investment teams
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h4 className="font-semibold mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Support</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ResearchGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 