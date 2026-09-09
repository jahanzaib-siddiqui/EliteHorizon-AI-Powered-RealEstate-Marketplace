import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaChevronCircleUp } from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Company Column */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Company</h4>
          <ul style={styles.list}>
            <li style={styles.listItem}>About Us</li>
            <li style={styles.listItem}>Contact Us</li>
            <li style={styles.listItem}>Jobs</li>
            <li style={styles.listItem}>Help & Support</li>
            <li style={styles.listItem}>Advertise On Elite Horizon</li>
            <li style={styles.listItem}>Terms Of Use</li>
          </ul>
        </div>

        {/* Connect Column */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Connect</h4>
          <ul style={styles.list}>
            <li style={styles.listItem}>Blog</li>
            <li style={styles.listItem}>News</li>
            <li style={styles.listItem}>Forum</li>
            <li style={styles.listItem}>Property Comparison</li>
            <li style={styles.listItem}>Add Property</li>
          </ul>
        </div>

        {/* Head Office Column */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Head Office</h4>
          <div style={styles.contactItem}>
            <FaMapMarkerAlt style={styles.icon} />
            <span>COMSATS University, Vehari Campus, Pakistan</span>
          </div>
          <div style={styles.contactItem}>
            <FaPhoneAlt style={styles.icon} />
            <span>0800-ELITE (35483) <br /> <small style={{color: '#6b7280'}}>Monday To Sunday 9AM To 6PM</small></span>
          </div>
          <div style={styles.contactItem}>
            <FaEnvelope style={styles.icon} />
            <span>Email Us</span>
          </div>
        </div>

        {/* Get Connected Column */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Get Connected</h4>
          <div style={styles.socialContainer}>
            {[
              { icon: <FaFacebookF />, bg: '#3b5998' },
              { icon: <FaInstagram />, bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
              { icon: <FaYoutube />,   bg: '#ff0000' },
              { icon: <FaXTwitter />,  bg: '#000000' },
              { icon: <FaLinkedinIn />,bg: '#0077b5' },
            ].map((s, i) => (
              <div
                key={i}
                style={{...styles.socialIcon, background: s.bg}}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {s.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={styles.bottomBar}>
        <p>© Copyright 2023 - 2026 EliteHorizon.com. All Rights Reserved</p>
        <div
          onClick={scrollToTop}
          style={styles.topBtn}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          TOP <FaChevronCircleUp style={{marginLeft: '5px'}} />
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: "#0a1f16",
    color: "#fff",
    padding: "70px 0 20px 0",
    fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 20px",
    flexWrap: "wrap",
    gap: '30px'
  },
  column: {
    flex: "1",
    minWidth: "200px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "25px",
    color: "#fff",
    letterSpacing: "0.03em",
    position: "relative",
    paddingBottom: "10px",
    borderBottom: "2px solid rgba(22,163,74,0.3)",
    display: "inline-block",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "12px",
    cursor: "pointer",
    transition: "color 0.2s, padding-left 0.2s",
  },
  contactItem: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "14px",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "20px",
    gap: '12px'
  },
  icon: {
    marginTop: "3px",
    fontSize: "16px",
    color: "#4ade80",
  },
  socialContainer: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  socialIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    transition: "transform 0.25s, box-shadow 0.25s",
  },
  bottomBar: {
    maxWidth: "1200px",
    margin: "40px auto 0",
    padding: "20px 20px 0",
    borderTop: "1px solid rgba(22,163,74,0.15)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
  },
  topBtn: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    color: "#4ade80",
    fontWeight: 700,
    fontSize: "13px",
    transition: "all 0.25s",
    borderRadius: "8px",
    padding: "6px 14px",
    background: "rgba(22,163,74,0.1)",
  }
};

export default Footer;