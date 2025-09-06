import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { FaCamera, FaInfoCircle, FaStop, FaTrash } from "react-icons/fa";
import FloatingCurrency from "../components/FloatingCurrency";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

// Utility function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix to get just the base64 string
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ScanContainer = styled.div`
  min-height: 100vh;
  padding: 6rem 2rem 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #000428, #004e92, #001e54);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  background: linear-gradient(to right, #ffffff, #00c6ff, #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
`;

const ScanWrapper = styled.div`
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const InstructionsCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  width: 100%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const InstructionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InstructionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    font-size: 1.2rem;
    color: white;
  }
`;

const InstructionTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0;
`;

const InstructionsList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const InstructionItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.6;

  &:before {
    content: "•";
    color: #00c6ff;
    font-size: 1.5rem;
  }
`;

const ScanFrame = styled(motion.div)`
  width: 100%;
  aspect-ratio: 4/3;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 60%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(45deg);
    animation: scanShine 5s infinite linear;
  }

  @keyframes scanShine {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }
`;

const ScanCorner = styled.div`
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #00c6ff;
  border-style: solid;
  border-width: 0;

  &.top-left {
    top: 20px;
    left: 20px;
    border-top-width: 3px;
    border-left-width: 3px;
  }

  &.top-right {
    top: 20px;
    right: 20px;
    border-top-width: 3px;
    border-right-width: 3px;
  }

  &.bottom-left {
    bottom: 20px;
    left: 20px;
    border-bottom-width: 3px;
    border-left-width: 3px;
  }

  &.bottom-right {
    bottom: 20px;
    right: 20px;
    border-bottom-width: 3px;
    border-right-width: 3px;
  }
`;

const ScanningAnimation = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, transparent, #00c6ff, transparent);
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
`;

const ScanButton = styled(motion.button)`
  background: linear-gradient(to right, #00c6ff, #0072ff, #0046ff);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 25px rgba(0, 114, 255, 0.5);
  transition: all 0.3s ease;
  margin-top: 2rem;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, #0046ff, #0072ff, #00c6ff);
    z-index: -1;
    transition: opacity 0.5s ease;
    opacity: 0;
  }

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 30px rgba(0, 114, 255, 0.6);

    &:before {
      opacity: 1;
    }
  }

  svg {
    font-size: 1.5rem;
  }
`;

const ScanText = styled.p`
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
`;

const ModeToggle = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 5px;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const ModeButton = styled(motion.button)`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 
    'linear-gradient(to right, #00c6ff, #0072ff)' : 
    'transparent'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  
  &:hover {
    color: white;
    background: ${props => props.active ? 
      'linear-gradient(to right, #00c6ff, #0072ff)' : 
      'rgba(255, 255, 255, 0.1)'};
  }
`;

const WebcamContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
`;

const WebcamVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const WebcamControls = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;

const CaptureButton = styled(motion.button)`
  background: linear-gradient(to right, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.5);
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 30px rgba(255, 107, 107, 0.6);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 2rem;
  }
`;

const StopButton = styled(motion.button)`
  background: linear-gradient(to right, #6c757d, #495057);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 25px rgba(108, 117, 125, 0.5);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(108, 117, 125, 0.6);
  }
  
  svg {
    font-size: 1rem;
  }
`;

// New styled components for results display
const ResultsContainer = styled(motion.div)`
  width: 100%;
  max-width: 1000px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin-top: 2rem;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  min-width: 120px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #00c6ff;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ClearButton = styled(motion.button)`
  background: linear-gradient(to right, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.5);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 10px 20px rgba(255, 107, 107, 0.6);
  }

  svg {
    font-size: 1rem;
  }
`;

const DetectionDetails = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
`;

const DetectionTitle = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: #00c6ff;
  margin-bottom: 1rem;
  text-align: center;
`;

const DetectionInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  background: rgba(0, 198, 255, 0.1);
  padding: 1rem;
  border-radius: 10px;
  border-left: 4px solid #00c6ff;
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ConfidenceFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(to right, #ff6b6b, #feca57, #48ca58);
  border-radius: 4px;
`;

const LoadingSpinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #00c6ff;
  border-radius: 50%;
  margin: 2rem auto;
`;

const Scan = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [webcamError, setWebcamError] = useState(null);
  const [captureMode, setCaptureMode] = useState('upload'); // 'upload' or 'webcam'
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const detectCurrency = async (base64Image) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/detect`, {
        image: base64Image,
      });
      return response.data;
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  };

  const handleScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setResult(null);

      // Create image URL for preview
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageName(file.name);

      const base64Image = await fileToBase64(file);
      const response = await detectCurrency(base64Image);
      setResult(response);
    } catch (error) {
      setError(error.message || "Failed to detect currency");
    } finally {
      setIsScanning(false);
    }
  };

  // Function to start webcam
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      
      setStream(mediaStream);
      setIsWebcamActive(true);
      setCaptureMode('webcam');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setWebcamError('Unable to access camera. Please check permissions.');
      console.error('Error accessing webcam:', error);
    }
  };

  // Function to stop webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsWebcamActive(false);
    setCaptureMode('upload');
    setWebcamError(null);
  };

  // Function to capture image from webcam
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsScanning(true);
      setError(null);
      setResult(null);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Create image URL for preview
      const url = canvas.toDataURL('image/jpeg', 0.8);
      setImageUrl(url);
      setImageName('webcam-capture.jpg');
      
      // Convert canvas to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Send to detection API
      const response = await detectCurrency(base64Image);
      setResult(response);
      
    } catch (error) {
      setError(error.message || "Failed to capture and detect currency");
    } finally {
      setIsScanning(false);
    }
  };

  // Cleanup webcam on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Helper function to clear results
  const handleClear = () => {
    setResult(null);
    setError(null);
    setImageUrl(null);
    setImageName(null);
  };

  // Helper function to get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#48ca58'; // Green
    if (confidence >= 60) return '#feca57'; // Yellow
    return '#ff6b6b'; // Red
  };

  // Helper function to get confidence description
  const getConfidenceDescription = (confidence) => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  };

  return (
    <ScanContainer>
      {/* Floating currency background elements with minimal density for better focus */}
      <FloatingCurrency count={7} />

      <Title
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Scan Currency
      </Title>

      <ScanWrapper>
        <InstructionsCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <InstructionHeader>
            <InstructionIcon>
              <FaInfoCircle />
            </InstructionIcon>
            <InstructionTitle>How to Scan</InstructionTitle>
          </InstructionHeader>

          <InstructionsList>
            <InstructionItem>
              Choose between uploading an image or using your camera.
            </InstructionItem>
            <InstructionItem>
              For camera mode: Allow camera permissions when prompted.
            </InstructionItem>
            <InstructionItem>
              Place the currency note on a flat, well-lit surface.
            </InstructionItem>
            <InstructionItem>
              Hold your device steady about 15-20 cm above the note.
            </InstructionItem>
            <InstructionItem>
              Make sure the entire note is visible within the frame.
            </InstructionItem>
            <InstructionItem>
              Press the capture button and wait for the result.
            </InstructionItem>
            <InstructionItem>
              The app will announce the detected currency denomination.
            </InstructionItem>
          </InstructionsList>
        </InstructionsCard>

        {/* Mode Toggle */}
        <ModeToggle>
          <ModeButton
            active={captureMode === 'upload'}
            onClick={() => {
              setCaptureMode('upload');
              stopWebcam();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Upload Image
          </ModeButton>
          <ModeButton
            active={captureMode === 'webcam'}
            onClick={startWebcam}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Use Camera
          </ModeButton>
        </ModeToggle>

        <ScanFrame
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ScanCorner className="top-left" />
          <ScanCorner className="top-right" />
          <ScanCorner className="bottom-left" />
          <ScanCorner className="bottom-right" />

          {isScanning && (
            <ScanningAnimation
              initial={{ top: 0 }}
              animate={{ top: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          )}

          {captureMode === 'webcam' && isWebcamActive ? (
            <WebcamContainer>
              <WebcamVideo
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </WebcamContainer>
          ) : (
            <ScanOverlay>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment" // This enables camera on mobile
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <ScanText>
                {isScanning ? "Scanning..." : "Ready to scan currency"}
              </ScanText>

              <ScanButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleScan}
                disabled={isScanning}
                aria-label="Start Currency Scan"
              >
                <FaCamera /> {isScanning ? "Scanning..." : "Start Scan"}
              </ScanButton>
            </ScanOverlay>
          )}
        </ScanFrame>

        {/* Webcam controls */}
        {captureMode === 'webcam' && isWebcamActive && (
          <WebcamControls>
            <CaptureButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={captureImage}
              disabled={isScanning}
              aria-label="Capture Photo"
            >
              <FaCamera />
            </CaptureButton>
            <StopButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopWebcam}
            >
              <FaStop /> Stop Camera
            </StopButton>
          </WebcamControls>
        )}
      </ScanWrapper>
        {/* Loading State */}
        {isScanning && (
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid #ff6b6b',
              color: '#ff6b6b',
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              marginTop: '1rem',
              maxWidth: '600px'
            }}
          >
            {error}
          </motion.div>
        )}
        
        {webcamError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid #ff6b6b',
              color: '#ff6b6b',
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              marginTop: '1rem',
              maxWidth: '600px'
            }}
          >
            {webcamError}
          </motion.div>
        )}

        {/* Results Container */}
        {result && !isScanning && (
          <ResultsContainer
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#00c6ff' }}>
              Detection Results
            </h3>

            {/* Clear button for results */}
            <ControlsContainer>
              <ClearButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
              >
                <FaTrash /> Clear Results
              </ClearButton>
            </ControlsContainer>

            {/* Statistics */}
            <StatsContainer>
              <StatItem>
                <StatValue>{result.currency}</StatValue>
                <StatLabel>Currency</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{result.denomination}</StatValue>
                <StatLabel>Denomination</StatLabel>
              </StatItem>
              {result.confidence && (
                <StatItem>
                  <StatValue>{Math.round(result.confidence)}%</StatValue>
                  <StatLabel>Confidence</StatLabel>
                </StatItem>
              )}
            </StatsContainer>

            {/* Image Preview */}
            {imageUrl && (
              <ImagePreview>
                <PreviewImage
                  src={imageUrl}
                  alt={imageName || 'Detected currency'}
                />
              </ImagePreview>
            )}

            {/* Detection Details */}
            <DetectionDetails>
              <DetectionTitle>
                Detected: {result.currency} {result.denomination}
              </DetectionTitle>
              
              <DetectionInfo>
                <InfoItem>
                  <InfoLabel>Currency Type</InfoLabel>
                  <InfoValue>{result.currency}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Denomination</InfoLabel>
                  <InfoValue>{result.denomination}</InfoValue>
                </InfoItem>
                
                {result.confidence && (
                  <InfoItem>
                    <InfoLabel>Confidence Level</InfoLabel>
                    <InfoValue>
                      {getConfidenceDescription(result.confidence)} ({Math.round(result.confidence)}%)
                    </InfoValue>
                    <ConfidenceBar>
                      <ConfidenceFill
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ backgroundColor: getConfidenceColor(result.confidence) }}
                      />
                    </ConfidenceBar>
                  </InfoItem>
                )}
                
                {result.message && (
                  <InfoItem style={{ gridColumn: '1 / -1' }}>
                    <InfoLabel>Additional Information</InfoLabel>
                    <InfoValue>{result.message}</InfoValue>
                  </InfoItem>
                )}
              </DetectionInfo>
            </DetectionDetails>
          </ResultsContainer>
        )}

        {/* Preview without results */}
        {imageUrl && !isScanning && !error && !result && (
          <ResultsContainer
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Preview</h3>
            <ControlsContainer>
              <ClearButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
              >
                <FaTrash /> Clear Preview
              </ClearButton>
            </ControlsContainer>
            <ImagePreview>
              <PreviewImage
                src={imageUrl}
                alt={imageName || 'Preview image'}
              />
            </ImagePreview>
          </ResultsContainer>
        )}
    </ScanContainer>
  );
};

export default Scan;
