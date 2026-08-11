import StepProgress from "components/display/StepProgress";

type Props = {
  currentStep: number;
  totalSteps?: number;
};

export default function PersonalizationProgress({
  currentStep,
  totalSteps = 5,
}: Props) {
  return <StepProgress currentStep={currentStep} totalSteps={totalSteps} />;
}
