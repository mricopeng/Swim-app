'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaSwimmer, FaChartLine, FaSignOutAlt, FaCalendarAlt, FaHome } from 'react-icons/fa';
import { MdDashboard, MdPerson } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Define types for our workout data
interface WorkoutSummary {
  totalDistance: number;
  strokeDistances: {
    freestyle: number;
    backstroke: number;
    breaststroke: number;
    butterfly: number;
    im: number;
    choice: number;
  };
  intensityDistances: {
    [key: string]: number; // Will store distances for each intensity dynamically
  };
}

type StrokeType = 'drill' | 'kick' | 'scull' | 'normal';
type IntensityType = 
  | { type: 'heartRate'; value: 150 | 155 | 160 | 165 | 170 | 175 | 180 | 185 | 190 }
  | { type: 'heartRateBy10'; value: 24 | 25 | 26 | 27 | 28 | 29 | 30 }
  | { type: 'standard'; value: 'easy' | 'moderate' | 'strong' | 'fast' }
  | { type: 'polarZones'; value: 'grey' | 'blue' | 'green' | 'orange' | 'red' }
  | { type: 'international'; value: 'yellow' | 'white' | 'pink' | 'red' | 'blue' | 'brown' | 'purple' }
  | null;

interface ParsedSet {
  distance: number;
  stroke: string;
  strokeType: StrokeType;
  intensity: IntensityType;
}

export default function WriteWorkout() {
  // State for pool type and workout text
  const [poolType, setPoolType] = useState<'SCY' | 'SCM' | 'LCM'>('LCM');
  const [workoutText, setWorkoutText] = useState('');
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary>({
    totalDistance: 0,
    strokeDistances: {
      freestyle: 0,
      backstroke: 0,
      breaststroke: 0,
      butterfly: 0,
      im: 0,
      choice: 0
    },
    intensityDistances: {}
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [parseError, setParseError] = useState<string | null>(null);
  // Add intensity system state
  const [intensitySystem, setIntensitySystem] = useState<'polar' | 'international'>('polar');

  // Helper function to identify stroke
  const getStroke = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('fr') || lowerText.includes('free')) return 'freestyle';
    if (lowerText.includes('bk') || lowerText.includes('back')) return 'backstroke';
    if (lowerText.includes('br') || lowerText.includes('breast')) return 'breaststroke';
    if (lowerText.includes('fl') || lowerText.includes('fly') || lowerText.includes('butterfly')) return 'butterfly';
    if (lowerText.includes('im') || lowerText.includes('medley')) return 'im';
    if (lowerText.includes('ch') || lowerText.includes('choice')) return 'choice';
    return 'freestyle'; // Default to freestyle if no stroke specified
  };

  // Helper function to identify stroke type modifiers
  const getStrokeType = (text: string): StrokeType => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('drill') || lowerText.includes('dr')) return 'drill';
    if (lowerText.includes('kick') || lowerText.includes('k')) return 'kick';
    if (lowerText.includes('scull')) return 'scull';
    return 'normal';
  };

  // Update getIntensity to use the selected system
  const getIntensity = (text: string): IntensityType => {
    const lowerText = text.toLowerCase();
    
    // Heart Rate
    const hrMatch = text.match(/hr(\d{3})/i);
    if (hrMatch) {
      const hr = parseInt(hrMatch[1]);
      if ([150, 155, 160, 165, 170, 175, 180, 185, 190].includes(hr)) {
        return { type: 'heartRate', value: hr as 150 | 155 | 160 | 165 | 170 | 175 | 180 | 185 | 190 };
      }
    }

    // Heart Rate by 10
    const hr10Match = text.match(/hr(\d{2})/i);
    if (hr10Match) {
      const hr = parseInt(hr10Match[1]);
      if ([24, 25, 26, 27, 28, 29, 30].includes(hr)) {
        return { type: 'heartRateBy10', value: hr as 24 | 25 | 26 | 27 | 28 | 29 | 30 };
      }
    }

    // Standard
    if (lowerText.includes('easy')) return { type: 'standard', value: 'easy' };
    if (lowerText.includes('moderate')) return { type: 'standard', value: 'moderate' };
    if (lowerText.includes('strong')) return { type: 'standard', value: 'strong' };
    if (lowerText.includes('fast')) return { type: 'standard', value: 'fast' };

    // Colors - check based on selected system
    if (intensitySystem === 'polar') {
      if (lowerText.includes('grey')) return { type: 'polarZones', value: 'grey' };
      if (lowerText.includes('blue')) return { type: 'polarZones', value: 'blue' };
      if (lowerText.includes('green')) return { type: 'polarZones', value: 'green' };
      if (lowerText.includes('orange')) return { type: 'polarZones', value: 'orange' };
      if (lowerText.includes('red')) return { type: 'polarZones', value: 'red' };
    } else {
      if (lowerText.includes('yellow')) return { type: 'international', value: 'yellow' };
      if (lowerText.includes('white')) return { type: 'international', value: 'white' };
      if (lowerText.includes('pink')) return { type: 'international', value: 'pink' };
      if (lowerText.includes('red')) return { type: 'international', value: 'red' };
      if (lowerText.includes('blue')) return { type: 'international', value: 'blue' };
      if (lowerText.includes('brown')) return { type: 'international', value: 'brown' };
      if (lowerText.includes('purple')) return { type: 'international', value: 'purple' };
    }

    return null;
  };

  // Helper function to parse numbers from text
  const parseDistance = (text: string): number => {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Helper function to parse bracket content
  const parseBracketContent = (content: string): number => {
    console.log('Parsing bracket content:', content);
    // Remove brackets and clean up content
    const text = content
      .replace(/[\(\[\{]/g, '')  // Remove opening brackets
      .replace(/[\)\]\}]/g, '')  // Remove closing brackets
      .replace(/\n/g, ' ')       // Replace newlines with spaces
      .toLowerCase()
      .trim();

    console.log('Cleaned text:', text);

    if (!text) {
      console.log('Empty text, returning 0');
      return 0;
    }

    let distance = 0;
    // Split by plus signs and spaces, filtering out empty strings
    const parts = text.split(/[+\s]+/).filter(part => part.length > 0);
    console.log('Split parts:', parts);

    for (const part of parts) {
      console.log('Processing part:', part);
      // Handle multiplier notation (e.g., "4x100")
      if (part.match(/^\d+\s*[x×*]\s*\d+$/)) {
        console.log('Found multiplier notation:', part);
        const [reps, dist] = part.split(/[x×*]/).map(s => s.trim());
        if (reps && dist) {
          const partDistance = parseInt(reps) * parseInt(dist);
          console.log(`Calculated ${reps} x ${dist} = ${partDistance}`);
          distance += partDistance;
        }
      }
      // Handle simple numbers
      else if (part.match(/^\d+$/)) {
        console.log('Found simple number:', part);
        distance += parseInt(part);
      } else {
        console.log('Skipping non-numeric part:', part);
      }
    }

    console.log('Final bracket distance:', distance);
    return distance;
  };

  // Update parseLine to handle all cases correctly
  const parseLine = (line: string): ParsedSet => {
    const text = line.toLowerCase().trim();
    if (!text) return { distance: 0, stroke: 'freestyle', strokeType: 'normal', intensity: null };

    let distance = 0;
    const parts = text.split(/[\s+]+/);
    let i = 0;

    while (i < parts.length) {
      const part = parts[i].trim();
      if (!part) {
        i++;
        continue;
      }

      // Handle multiplier notation (e.g., "4x100")
      if (part.match(/^\d+\s*[x×*]\s*\d+$/)) {
        const [reps, dist] = part.split(/[x×*]/);
        if (reps && dist) {
          distance += parseInt(reps.trim()) * parseInt(dist.trim());
        }
        i++;
      }
      // Handle simple numbers
      else if (part.match(/^\d+$/)) {
        distance += parseInt(part);
        i++;
      } else {
        i++;
      }
    }

    return {
      distance,
      stroke: getStroke(text),
      strokeType: getStrokeType(text),
      intensity: getIntensity(text)
    };
  };

  // Helper function to get intensity display name
  const getIntensityDisplayName = (intensity: IntensityType): string | null => {
    if (!intensity) return null;
    
    switch (intensity.type) {
      case 'heartRate':
        return `HR ${intensity.value}`;
      case 'heartRateBy10':
        return `HR ${intensity.value}`;
      case 'standard':
        return intensity.value.charAt(0).toUpperCase() + intensity.value.slice(1);
      case 'polarZones':
      case 'international':
        return intensity.value.charAt(0).toUpperCase() + intensity.value.slice(1);
      default:
        return null;
    }
  };

  // Update the updateWorkoutSummary function to handle multi-line content
  const updateWorkoutSummary = (text: string) => {
    console.log('Starting workout summary update with text:', text);
    setParseError(null);
    
    try {
      const lines = text.split('\n');
      console.log('Split lines:', lines);
      const newSummary: WorkoutSummary = {
        totalDistance: 0,
        strokeDistances: {
          freestyle: 0,
          backstroke: 0,
          breaststroke: 0,
          butterfly: 0,
          im: 0,
          choice: 0
        },
        intensityDistances: {}
      };

      let pendingMultiplier = 1;
      let bracketContent = '';
      let bracketCount = 0;
      let collectingBracket = false;

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        console.log(`\nProcessing line ${i + 1}:`, trimmedLine);
        if (!trimmedLine) {
          console.log('Skipping empty line');
          continue;
        }

        // Check for standalone multiplier
        const multiplierMatch = trimmedLine.match(/^(\d+)\s*[x×*]\s*$/);
        if (multiplierMatch && !collectingBracket) {
          pendingMultiplier = parseInt(multiplierMatch[1]);
          console.log('Found standalone multiplier:', pendingMultiplier);
          continue;
        }

        // Check for multiplier with bracket on same line
        const multiplierBracketMatch = trimmedLine.match(/^(\d+)\s*[x×*]\s*[\(\[\{]/);
        if (multiplierBracketMatch && !collectingBracket) {
          pendingMultiplier = parseInt(multiplierBracketMatch[1]);
          console.log('Found multiplier with bracket:', pendingMultiplier);
          collectingBracket = true;
          bracketContent = trimmedLine.substring(trimmedLine.indexOf(multiplierBracketMatch[0]) + multiplierBracketMatch[0].length - 1);
          bracketCount = (bracketContent.match(/[\(\[\{]/g) || []).length - (bracketContent.match(/[\)\]\}]/g) || []).length;
          console.log('Initial bracket content:', bracketContent);
          console.log('Initial bracket count:', bracketCount);
          continue;
        }

        // Check for bracket start
        if (!collectingBracket && (trimmedLine.startsWith('(') || trimmedLine.startsWith('[') || trimmedLine.startsWith('{'))) {
          collectingBracket = true;
          bracketContent = trimmedLine;
          bracketCount = (trimmedLine.match(/[\(\[\{]/g) || []).length - (trimmedLine.match(/[\)\]\}]/g) || []).length;
          console.log('Started bracket collection:', bracketContent);
          console.log('Bracket count:', bracketCount);
          continue;
        }

        // If we're collecting bracket content
        if (collectingBracket) {
          bracketContent += '\n' + trimmedLine;
          const openBrackets = (trimmedLine.match(/[\(\[\{]/g) || []).length;
          const closeBrackets = (trimmedLine.match(/[\)\]\}]/g) || []).length;
          bracketCount += openBrackets - closeBrackets;
          console.log('Updated bracket content:', bracketContent);
          console.log('Updated bracket count:', bracketCount);

          // If brackets are balanced, process the content
          if (bracketCount === 0) {
            console.log('Processing complete bracket content:', bracketContent);
            const bracketDistance = parseBracketContent(bracketContent);
            console.log('Bracket distance:', bracketDistance);
            if (bracketDistance > 0) {
              const totalDistance = bracketDistance * pendingMultiplier;
              console.log(`Total distance for bracket: ${bracketDistance} * ${pendingMultiplier} = ${totalDistance}`);
              newSummary.totalDistance += totalDistance;

              // Get stroke and intensity from the entire bracket content
              const stroke = getStroke(bracketContent);
              if (stroke in newSummary.strokeDistances) {
                newSummary.strokeDistances[stroke as keyof typeof newSummary.strokeDistances] += totalDistance;
                console.log(`Added ${totalDistance} to ${stroke}`);
              }

              const intensity = getIntensity(bracketContent);
              const intensityName = getIntensityDisplayName(intensity);
              if (intensityName) {
                newSummary.intensityDistances[intensityName] = 
                  (newSummary.intensityDistances[intensityName] || 0) + totalDistance;
                console.log(`Added ${totalDistance} to intensity ${intensityName}`);
              }
            }
            collectingBracket = false;
            bracketContent = '';
            pendingMultiplier = 1;
            continue;
          }
          continue;
        }

        // Process regular line
        console.log('Processing as regular line:', trimmedLine);
        const parsed = parseLine(trimmedLine);
        console.log('Parsed line result:', parsed);
        if (parsed.distance > 0) {
          const totalDistance = parsed.distance * pendingMultiplier;
          console.log(`Regular line distance: ${parsed.distance} * ${pendingMultiplier} = ${totalDistance}`);
          newSummary.totalDistance += totalDistance;
          if (parsed.stroke in newSummary.strokeDistances) {
            newSummary.strokeDistances[parsed.stroke as keyof typeof newSummary.strokeDistances] += totalDistance;
            console.log(`Added ${totalDistance} to ${parsed.stroke}`);
          }
          const intensityName = getIntensityDisplayName(parsed.intensity);
          if (intensityName) {
            newSummary.intensityDistances[intensityName] = 
              (newSummary.intensityDistances[intensityName] || 0) + totalDistance;
            console.log(`Added ${totalDistance} to intensity ${intensityName}`);
          }
          pendingMultiplier = 1;
        }
      }

      console.log('Final workout summary:', newSummary);
      setWorkoutSummary(newSummary);
    } catch (error) {
      console.error('Error in updateWorkoutSummary:', error);
      setParseError(error instanceof Error ? error.message : 'Invalid workout format');
    }
  };

  // Update the textarea onChange handler
  const handleWorkoutTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setWorkoutText(newText);
    updateWorkoutSummary(newText);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
            <FaSwimmer className="h-8 w-8 text-teal-500" />
            <span className="ml-2 text-xl font-semibold text-gray-900">SwimTracker</span>
          </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <FaHome className="h-5 w-5 mr-2" />
              Home
            </Link>
            <Link href="/history" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <FaCalendarAlt className="h-5 w-5 mr-2" />
              Calendar
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <MdDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            <Link href="/insights" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <FaChartLine className="h-5 w-5 mr-2" />
              Insights
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <MdPerson className="h-5 w-5 mr-2" />
              Profile
            </Link>
            <button className="text-gray-700 hover:text-teal-500 transition-colors flex items-center">
              <FaSignOutAlt className="h-5 w-5 mr-2" />
              Log Out
            </button>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left side - Input area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Pool Type Selector */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Pool Type</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setPoolType('SCY')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      poolType === 'SCY' 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Short Course Yards
                  </button>
                  <button
                    onClick={() => setPoolType('SCM')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      poolType === 'SCM' 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Short Course Meters
                  </button>
                  <button
                    onClick={() => setPoolType('LCM')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      poolType === 'LCM' 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Long Course Meters
                  </button>
                </div>
              </div>

              {/* Intensity System Selector */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Intensity System</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIntensitySystem('polar')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      intensitySystem === 'polar'
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Polar Zones (Grey, Blue, Green, Orange, Red)
                  </button>
                  <button
                    onClick={() => setIntensitySystem('international')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      intensitySystem === 'international'
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    International (Yellow, White, Pink, Red, Blue, Brown, Purple)
                  </button>
                </div>
              </div>

              {/* Workout Input */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Write Your Workout</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your workout in free format. Use new lines to separate sets.
                </p>
                <div className="space-y-2">
                  <textarea
                    rows={20}
                    value={workoutText}
                    onChange={handleWorkoutTextChange}
                    placeholder="Example:
Warm up:
400 free
4x100 back
4x50 choice

Main Set:
4x (100 fly + 100 free)
2x[100 breast]"
                    className={`w-full rounded-md border ${parseError ? 'border-red-500' : 'border-gray-300'} shadow-sm px-4 py-3 font-mono text-gray-900 focus:ring-teal-500 focus:border-teal-500`}
                  />
                  {parseError && (
                    <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">
                      ⚠️ {parseError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Summary */}
          <div className="w-80">
            {/* Date Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Workout Date</h2>
              <div className="space-y-3">
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                    dateFormat="MMMM d, yyyy"
                    className="w-full px-4 py-3 rounded-md border-2 border-teal-500 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg font-medium text-gray-900"
                    customInput={
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-md border-2 border-teal-500 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg font-medium text-gray-900"
                      />
                    }
                  />
                  <button
                    onClick={() => document.querySelector<HTMLElement>('.react-datepicker-wrapper input')?.click()}
                    className="absolute right-0 top-0 h-full px-3 text-teal-500 hover:text-teal-600 transition-colors"
                    type="button"
                    aria-label="Open calendar"
                  >
                    <FaCalendarAlt className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FaCalendarAlt className="h-4 w-4" />
                  Set to Today
                </button>
              </div>
            </div>

            {/* Workout Summary */}
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Workout Summary</h2>
              
              {/* Total Distance */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700">Total Distance</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {workoutSummary.totalDistance} {poolType === 'SCY' ? 'yards' : 'meters'}
                </p>
              </div>

              {/* Distance by Stroke */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Distance by Stroke</h3>
                <div className="space-y-2">
                  {Object.entries(workoutSummary.strokeDistances).map(([stroke, distance]) => (
                    distance > 0 && (
                      <div key={stroke} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{stroke}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {distance} {poolType === 'SCY' ? 'yards' : 'meters'}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Distance by Intensity */}
              {Object.keys(workoutSummary.intensityDistances).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Distance by Intensity</h3>
                  <div className="space-y-2">
                    {Object.entries(workoutSummary.intensityDistances).map(([intensity, distance]) => (
                      <div key={intensity} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{intensity}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {distance} {poolType === 'SCY' ? 'yards' : 'meters'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Format */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Format Examples:</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Stroke Types: drill/dr, kick/k, scull</p>
                  <p>Heart Rate: hr150-hr190 (by 5)</p>
                  <p>Heart Rate by 10: hr24-hr30</p>
                  <p>Standard: Easy, Moderate, Strong, Fast</p>
                  {intensitySystem === 'polar' ? (
                    <p>Polar Zones: Grey, Blue, Green, Orange, Red</p>
                  ) : (
                    <p>International: Yellow, White, Pink, Red, Blue, Brown, Purple</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 