import ReviewCard from "./ReviewCard";

export default function RenderReviews() {
  return (
    <div className="grid grid-cols-2 gap-5">
        <ReviewCard
          reviewerName="John Doe"
          reviewerAvatar=""
          reviewDate="March 15, 2024"
          reviewText="Great apartment! Clean, spacious, and in a fantastic location. The host was very responsive and helpful. Would definitely stay here again!"
          stayPeriod="Stayed in February 2024"
        />

        <ReviewCard
          reviewerName="Jane Smith"
          reviewerAvatar=""
          reviewDate="April 10, 2024"
          reviewText="The apartment was decent but had some issues with the plumbing. The location was good, but the noise from the street was a bit bothersome at night."
          stayPeriod="Stayed in March 2024"
        />

        <ReviewCard
          reviewerName="Alice Johnson"
          reviewerAvatar=""
          reviewDate="May 5, 2024"
          reviewText="I had a wonderful stay! The apartment was beautifully decorated and had all the amenities I needed. The host went above and beyond to make sure I was comfortable."
          stayPeriod="Stayed in April 2024"
        />
    </div>
  );
}
