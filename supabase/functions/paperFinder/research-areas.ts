import type { ResearchArea } from './types.ts'

export const RESEARCH_AREAS: ResearchArea[] = [
  { 
    name: 'Artificial Intelligence', 
    keywords: [
      'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 
      'neural network', 'llm', 'language model', 'transformer', 'gpt', 'bert', 
      'nlp', 'natural language', 'reinforcement learning', 'supervised learning', 
      'unsupervised learning', 'classification', 'regression', 'clustering', 
      'generative', 'discriminative', 'attention', 'embedding'
    ] 
  },
  { 
    name: 'Robotics', 
    keywords: [
      'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 
      'slam', 'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 
      'path planning', 'localization', 'mapping', 'control', 'actuator', 
      'sensor fusion', 'kinematics'
    ] 
  },
  { 
    name: 'Computer Vision', 
    keywords: [
      'computer vision', 'image processing', 'visual', 'vision', 'opencv', 
      'segmentation', 'detection', 'recognition', 'cnn', 'yolo', 'object detection', 
      'image classification', 'face recognition', 'optical', 'pixel', 'convolution', 
      'feature extraction', 'tracking'
    ] 
  }
]