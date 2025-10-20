import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Home.css";

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <header className="home-header">
        <div className="header-content">
          <h1> My Enterprise HR System</h1>
          <nav>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              {isAuthenticated ? (
                <li>
                  <Link to="/dashboard" className="nav-btn">
                    Dashboard
                  </Link>
                </li>
              ) : (
                <li>
                  <Link to="/login" className="nav-btn">
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Streamline Your HR Operations</h2>
          <p>
            Comprehensive HR management solution for modern enterprises. Manage
            employees, track attendance, handle leaves, and optimize your
            workforce.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn-secondary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card">
            <div className="card-icon">👥</div>
            <h4>Employee Management</h4>
            <p>Centralized employee database</p>
          </div>
          <div className="floating-card">
            <div className="card-icon">📊</div>
            <h4>Analytics</h4>
            <p>Real-time workforce insights</p>
          </div>
          <div className="floating-card">
            <div className="card-icon">💼</div>
            <h4>HR Tools</h4>
            <p>Complete HR toolkit</p>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Employee Management</h3>
              <p>
                Complete employee profiles, department management, and
                organizational hierarchy.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Attendance Tracking</h3>
              <p>
                Real-time attendance monitoring with clock-in/out functionality
                and reports.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏖️</div>
              <h3>Leave Management</h3>
              <p>
                Streamlined leave requests, approvals, and balance tracking.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h3>Asset Management</h3>
              <p>
                Track company assets, assignments, and maintenance schedules.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Performance Reviews</h3>
              <p>360-degree feedback and performance evaluation system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Role-Based Access</h3>
              <p>
                Granular permissions for different user roles and departments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Enterprise HR</h2>
              <p>
                Enterprise HR System is a comprehensive human resource
                management solution designed for modern businesses. We help
                organizations streamline their HR processes, improve employee
                engagement, and make data-driven decisions.
              </p>
              <div className="stats">
                <div className="stat">
                  <h3>1000+</h3>
                  <p>Companies Trust Us</p>
                </div>
                <div className="stat">
                  <h3>50K+</h3>
                  <p>Employees Managed</p>
                </div>
                <div className="stat">
                  <h3>99.9%</h3>
                  <p>Uptime</p>
                </div>
              </div>
            </div>
            <div className="about-image">
              <img src="https://picsum.photos/500/300?random=1" alt="HR Team" />
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="container">
          <h2>Get In Touch</h2>
          <p>Ready to transform your HR operations? Contact us today.</p>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h4>Email</h4>
                  <p>hr@enterprise.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">🏢</div>
                <div>
                  <h4>Office</h4>
                  <p>123 Business District, City, State 12345</p>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <input type="text" placeholder="Your Name" />
                <input type="email" placeholder="Your Email" />
                <textarea placeholder="Your Message" rows="4"></textarea>
                <button type="submit" className="btn-primary">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Enterprise HR</h3>
              <p>Streamlining HR operations for modern enterprises.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#about">About</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
                <li>
                  <Link to="/login">Login</Link>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Enterprise HR System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
