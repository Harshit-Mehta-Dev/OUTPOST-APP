
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import "./VideoSection.css";

export default function VideoSection() {
  return (
    <section className="video-section">
      <div className="video-ambient-glow" />
      
      <div className="video-container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="video-content"
        >
          <div className="video-marker">
            <PlayCircle size={14} /> Video Transmission
          </div>
          
          <h3 className="video-heading">
            See <span>Outpost</span> in Action
          </h3>
          <p className="video-description">
            Watch how our platform redefines team communication and deployment protocols in real-time.
          </p>

          <div className="video-frame-wrapper">
            <div className="video-glow-border" />
            <div className="video-embed-container">
              {/* Replace the src URL with your actual YouTube video embed URL */}
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/54yZWmck5jQ?autoplay=0" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="youtube-iframe"
              ></iframe>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
