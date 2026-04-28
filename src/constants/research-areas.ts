import { Bot, Eye, Network } from 'lucide-react';
import type { ResearchArea } from '@/types/research';

export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'robotics',
    label: 'Robotics',
    icon: Bot,
    keywords: [
      'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam',
      'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning',
      'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'
    ]
  },
  {
    id: 'cv',
    label: 'Computer Vision',
    icon: Eye,
    keywords: [
      'computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation',
      'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification',
      'face recognition', 'optical', 'pixel', 'convolution', 'feature extraction', 'tracking'
    ]
  },
  {
    id: 'llm',
    label: 'Large Language Models',
    icon: Network,
    keywords: [
      'large language model', 'llm', 'gpt', 'claude', 'llama', 'mistral', 'gemini',
      'foundation model', 'pre-training', 'fine-tuning', 'prompt engineering', 'rag',
      'retrieval augmented', 'instruction tuning', 'alignment', 'rlhf', 'chain of thought'
    ]
  }
];
