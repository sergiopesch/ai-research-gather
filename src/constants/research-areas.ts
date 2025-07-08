import { Brain, Bot, Eye } from 'lucide-react';
import type { ResearchArea } from '@/types/research';

export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    icon: Brain,
    keywords: [
      'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 
      'llm', 'language model', 'transformer', 'gpt', 'bert', 'nlp', 'natural language',
      'reinforcement learning', 'supervised learning', 'unsupervised learning', 'classification',
      'regression', 'clustering', 'generative', 'discriminative', 'attention', 'embedding'
    ],
    color: 'area-badge-ai',
    gradient: 'bg-gradient-ai'
  },
  {
    id: 'robotics',
    label: 'Robotics',
    icon: Bot,
    keywords: [
      'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam', 
      'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning',
      'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'
    ],
    color: 'area-badge-robotics',
    gradient: 'bg-gradient-robotics'
  },
  {
    id: 'cv',
    label: 'Computer Vision',
    icon: Eye,
    keywords: [
      'computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation', 
      'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification',
      'face recognition', 'optical', 'pixel', 'convolution', 'feature extraction', 'tracking'
    ],
    color: 'area-badge-cv',
    gradient: 'bg-gradient-cv'
  }
];