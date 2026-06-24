'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BodyConditionScore from '@/components/BodyConditionScore';
import IngredientSearch from '@/components/IngredientSearch';
import type { CatProfile } from '@/lib/types';

interface QuizFormData {
  name: string;
  age: number;
  ageUnit: 'years' | 'months';
  gender: 'male' | 'female' | 'unknown';
  isNeutered: boolean;
  weight: number;
  bodyConditionScore: number;
  activityLevel: 'low' | 'moderate' | 'high';
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  healthConditions: string[];
  allergies: string[];
  foodTypePreference: 'wet' | 'dry' | 'both';
  mustInclude: string[];
  mustExclude: string[];
  budgetRange: 'budget' | 'moderate' | 'premium' | 'any';
}

const HEALTH_CONDITIONS = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'kidney disease', label: 'Kidney Disease' },
  { id: 'urinary issues', label: 'Urinary Issues' },
  { id: 'food allergies', label: 'Food Allergies' },
  { id: 'ibd', label: 'IBD (Inflammatory Bowel Disease)' },
  { id: 'hyperthyroidism', label: 'Hyperthyroidism' },
  { id: 'none', label: 'None of the above' },
];

const BUDGET_OPTIONS = [
  {
    value: 'budget',
    label: 'Budget-Friendly',
    description: 'Best value options',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balance of quality and price',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Top-tier ingredients and brands',
  },
  { value: 'any', label: 'Any Price', description: 'Show me everything' },
];

const TOTAL_STEPS = 5;

export default function CatQuiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuizFormData>({
    name: '',
    age: 1,
    ageUnit: 'years',
    gender: 'unknown',
    isNeutered: false,
    weight: 10,
    bodyConditionScore: 5,
    activityLevel: 'moderate',
    indoorOutdoor: 'indoor',
    healthConditions: [],
    allergies: [],
    foodTypePreference: 'both',
    mustInclude: [],
    mustExclude: [],
    budgetRange: 'any',
  });

  const updateField = <K extends keyof QuizFormData>(
    field: K,
    value: QuizFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHealthCondition = (condition: string) => {
    if (condition === 'none') {
      updateField('healthConditions', ['none']);
      return;
    }
    const current = formData.healthConditions.filter((c) => c !== 'none');
    if (current.includes(condition)) {
      updateField(
        'healthConditions',
        current.filter((c) => c !== condition),
      );
    } else {
      updateField('healthConditions', [...current, condition]);
    }
  };

  const handleSubmit = () => {
    const ageInYears =
      formData.ageUnit === 'months' ? formData.age / 12 : formData.age;

    const profile: CatProfile = {
      name: formData.name || undefined,
      age: ageInYears,
      weight: formData.weight,
      gender: formData.gender,
      isNeutered: formData.isNeutered,
      bodyConditionScore: formData.bodyConditionScore,
      activityLevel: formData.activityLevel,
      indoorOutdoor: formData.indoorOutdoor,
      healthConditions: formData.healthConditions.filter((c) => c !== 'none'),
      allergies: formData.allergies,
      ingredientPreferences: {
        mustInclude: formData.mustInclude,
        mustExclude: formData.mustExclude,
      },
      budgetRange: formData.budgetRange,
      foodTypePreference: formData.foodTypePreference,
    };

    const encoded = btoa(JSON.stringify(profile));
    router.push(`/results?profile=${encoded}`);
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Tell us about your cat */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your cat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Cat&apos;s Name</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="What's your cat's name?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-age">Age</Label>
                <Input
                  id="cat-age"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.age}
                  onChange={(e) =>
                    updateField('age', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <RadioGroup
                  value={formData.ageUnit}
                  onValueChange={(val) =>
                    updateField('ageUnit', val as 'years' | 'months')
                  }
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="years" id="age-years" />
                    <Label htmlFor="age-years">Years</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="months" id="age-months" />
                    <Label htmlFor="age-months">Months</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(val) =>
                  updateField('gender', val as 'male' | 'female' | 'unknown')
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="male" id="gender-male" />
                  <Label htmlFor="gender-male">Male</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="female" id="gender-female" />
                  <Label htmlFor="gender-female">Female</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="unknown" id="gender-unknown" />
                  <Label htmlFor="gender-unknown">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="neutered"
                checked={formData.isNeutered}
                onCheckedChange={(checked) =>
                  updateField('isNeutered', checked === true)
                }
              />
              <Label htmlFor="neutered">Spayed / Neutered</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: How's their body? */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>How&apos;s their body?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                min={1}
                max={40}
                step={0.1}
                value={formData.weight}
                onChange={(e) =>
                  updateField('weight', parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <BodyConditionScore
              value={formData.bodyConditionScore}
              onChange={(val) => updateField('bodyConditionScore', val)}
            />

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <RadioGroup
                value={formData.activityLevel}
                onValueChange={(val) =>
                  updateField(
                    'activityLevel',
                    val as 'low' | 'moderate' | 'high',
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="low" id="activity-low" />
                  <Label htmlFor="activity-low">
                    Low - Mostly naps and lounges
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="moderate" id="activity-moderate" />
                  <Label htmlFor="activity-moderate">
                    Moderate - Regular play sessions
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="high" id="activity-high" />
                  <Label htmlFor="activity-high">
                    High - Very active, lots of running and jumping
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Indoor / Outdoor</Label>
              <RadioGroup
                value={formData.indoorOutdoor}
                onValueChange={(val) =>
                  updateField(
                    'indoorOutdoor',
                    val as 'indoor' | 'outdoor' | 'both',
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="indoor" id="io-indoor" />
                  <Label htmlFor="io-indoor">Indoor only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="outdoor" id="io-outdoor" />
                  <Label htmlFor="io-outdoor">Outdoor only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="both" id="io-both" />
                  <Label htmlFor="io-both">Both indoor and outdoor</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Health & Sensitivities */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Health &amp; Sensitivities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Health Conditions</Label>
              <p className="text-sm text-muted-foreground">
                Select any that apply to your cat.
              </p>
              <div className="space-y-2">
                {HEALTH_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`health-${condition.id}`}
                      checked={formData.healthConditions.includes(condition.id)}
                      onCheckedChange={() =>
                        toggleHealthCondition(condition.id)
                      }
                    />
                    <Label htmlFor={`health-${condition.id}`}>
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <IngredientSearch
              label="Known Allergies / Sensitivities"
              placeholder="Search for ingredients your cat is sensitive to..."
              selectedIngredients={formData.allergies}
              onSelect={(ingredient) =>
                updateField('allergies', [...formData.allergies, ingredient])
              }
              onRemove={(ingredient) =>
                updateField(
                  'allergies',
                  formData.allergies.filter((i) => i !== ingredient),
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Food Preferences */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Food Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Food Type Preference</Label>
              <RadioGroup
                value={formData.foodTypePreference}
                onValueChange={(val) =>
                  updateField(
                    'foodTypePreference',
                    val as 'wet' | 'dry' | 'both',
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="wet" id="food-wet" />
                  <Label htmlFor="food-wet">Wet food only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dry" id="food-dry" />
                  <Label htmlFor="food-dry">Dry food only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="both" id="food-both" />
                  <Label htmlFor="food-both">Both wet and dry</Label>
                </div>
              </RadioGroup>
            </div>

            <IngredientSearch
              label="Must-Include Ingredients"
              placeholder="Search for ingredients you want in the food..."
              selectedIngredients={formData.mustInclude}
              onSelect={(ingredient) =>
                updateField('mustInclude', [...formData.mustInclude, ingredient])
              }
              onRemove={(ingredient) =>
                updateField(
                  'mustInclude',
                  formData.mustInclude.filter((i) => i !== ingredient),
                )
              }
            />

            <IngredientSearch
              label="Must-Exclude Ingredients"
              placeholder="Search for ingredients you want to avoid..."
              selectedIngredients={formData.mustExclude}
              onSelect={(ingredient) =>
                updateField('mustExclude', [...formData.mustExclude, ingredient])
              }
              onRemove={(ingredient) =>
                updateField(
                  'mustExclude',
                  formData.mustExclude.filter((i) => i !== ingredient),
                )
              }
            />

            <div className="space-y-2">
              <Label>Budget Range</Label>
              <RadioGroup
                value={formData.budgetRange}
                onValueChange={(val) =>
                  updateField(
                    'budgetRange',
                    val as 'budget' | 'moderate' | 'premium' | 'any',
                  )
                }
              >
                {BUDGET_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`budget-${option.value}`}
                    />
                    <Label htmlFor={`budget-${option.value}`}>
                      <span className="font-medium">{option.label}</span>
                      <span className="ml-1 text-muted-foreground">
                        - {option.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Find Food */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review &amp; Find Food</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review your selections below. Click &quot;Edit&quot; on any
              section to make changes.
            </p>

            {/* About Your Cat */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">About Your Cat</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(1)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>
                  Name: {formData.name || 'Not provided'} | Age: {formData.age}{' '}
                  {formData.ageUnit}
                </p>
                <p>
                  Gender: {formData.gender} |{' '}
                  {formData.isNeutered ? 'Spayed/Neutered' : 'Intact'}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Body</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(2)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>
                  Weight: {formData.weight} lbs | BCS:{' '}
                  {formData.bodyConditionScore}/9
                </p>
                <p>
                  Activity: {formData.activityLevel} | {formData.indoorOutdoor}
                </p>
              </div>
            </div>

            {/* Health */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Health &amp; Sensitivities</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(3)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>
                  Conditions:{' '}
                  {formData.healthConditions.length > 0
                    ? formData.healthConditions.join(', ')
                    : 'None'}
                </p>
                <p>
                  Allergies:{' '}
                  {formData.allergies.length > 0
                    ? formData.allergies.join(', ')
                    : 'None'}
                </p>
              </div>
            </div>

            {/* Food Preferences */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Food Preferences</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(4)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>Food type: {formData.foodTypePreference}</p>
                <p>
                  Must include:{' '}
                  {formData.mustInclude.length > 0
                    ? formData.mustInclude.join(', ')
                    : 'None'}
                </p>
                <p>
                  Must exclude:{' '}
                  {formData.mustExclude.length > 0
                    ? formData.mustExclude.join(', ')
                    : 'None'}
                </p>
                <p>Budget: {formData.budgetRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        {currentStep < TOTAL_STEPS ? (
          <Button onClick={goNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Find My Cat&apos;s Food</Button>
        )}
      </div>
    </div>
  );
}
