import { createClient } from '@repo/supabase/server';
import ReviewCard from './ReviewCard';

import { MessageSquareText, Star } from 'lucide-react';

interface RenderReviewsProps {
  apartmentId: string;
}

function EmptyReviewsState() {
  return (
    <div className="col-span-full flex min-h-[150px] items-center justify-center rounded-3xl border border-dashed border-default-200 bg-default-50 p-8">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary/10">
          <MessageSquareText className="size-8 text-secondary" />
        </div>

        <h3 className="text-lg font-semibold text-foreground">
          No reviews yet
        </h3>

        <p className="mt-2 text-sm text-default-500">
          This apartment hasn&apos;t received any reviews yet. Be the first to
          share your experience after your stay.
        </p>
      </div>
    </div>
  );
}

export default async function RenderReviews({
  apartmentId,
}: RenderReviewsProps) {
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

  if (!reviews || reviews.length === 0) {
    return <EmptyReviewsState />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {reviews.map((review) => {
        const user = Array.isArray(review.users)
          ? review.users[0]
          : review.users;

        const reviewDate = review.created_at
          ? new Date(review.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '';

        const stayPeriod = review.stayed_date
          ? `Stayed in ${new Date(
              review.stayed_date
            ).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}`
          : '';

        return (
          <ReviewCard
            key={review.id}
            reviewerName={`${user?.first_name ?? ''} ${
              user?.last_name ?? ''
            }`.trim()}
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