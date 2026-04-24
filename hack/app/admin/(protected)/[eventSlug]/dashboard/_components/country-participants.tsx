import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getCountryParticipantStats } from '@/src/queries/dashboard';
import { CountryParticipantsChart } from './country-participants-chart';

interface CountryParticipantsProps {
  eventId: string;
}

export async function CountryParticipants({
  eventId,
}: CountryParticipantsProps) {
  const countryData = await getCountryParticipantStats(eventId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants by Country</CardTitle>
        <CardDescription>
          Total participants submitted for each country (top 10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CountryParticipantsChart data={countryData} />
      </CardContent>
    </Card>
  );
}
