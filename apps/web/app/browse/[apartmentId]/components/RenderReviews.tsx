import { createClient } from '@repo/supabase/server';
import ReviewCard from "./ReviewCard";

interface RenderReviewsProps {
  apartmentId: string;
}

export default async function RenderReviews({ apartmentId }: RenderReviewsProps) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      stayed_date,
      created_at,
      users(first_name, last_name, avatar_url)
    `)
    .eq('apartment_id', apartmentId)
    .order('created_at', { ascending: false });

  if (error) console.error(error);
  if (!reviews || reviews.length === 0) return <p className="text-sm text-gray-500">No reviews yet.</p>;

  return (
    <div className="grid grid-cols-2 gap-5">
      {reviews.map((review) => {
        const user = Array.isArray(review.users) ? review.users[0] : review.users;
        const reviewDate = review.created_at
          ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';

        const stayPeriod = review.stayed_date
          ? `Stayed in ${new Date(review.stayed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`
          : '';

        return (
          <ReviewCard
            key={review.id}
            reviewerName={`${user?.first_name} ${user?.last_name}`}
            reviewerAvatar={user?.avatar_url ?? ''}
            reviewDate={reviewDate}
            reviewText={review.comment ?? ''}
            stayPeriod={stayPeriod}
          />
        );
      })}
    </div>
  );
}
