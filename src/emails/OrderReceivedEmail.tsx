import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function OrderReceivedEmail({
  customerName,
  carMake,
  carModel,
  carYear,
}: {
  customerName: string;
  carMake: string;
  carModel: string;
  carYear: number;
}) {
  return (
    <Html lang="bg">
      <Head />
      <Preview>Получихме твоята заявка — Old Timer&apos;s</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#F5EDE2" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ color: "#5C1A1B", margin: 0, fontFamily: "Georgia, serif" }}>
            Old Timer&apos;s
          </Heading>
          <Text style={{ color: "#2A1414", fontSize: 18 }}>
            Здравей, {customerName} 👋
          </Text>
          <Text style={{ color: "#2A1414" }}>
            Получихме заявката ти за част за <strong>{carMake} {carModel} ({carYear})</strong>.
            Започваме да я обработваме веднага.
          </Text>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Heading as="h3" style={{ color: "#5C1A1B" }}>
            Какво следва?
          </Heading>
          <Text style={{ color: "#2A1414" }}>
            Преглеждаме заявката, проверяваме наличности при доставчиците ни и
            обикновено се връщаме до теб в рамките на 1–2 работни дни. Ще получиш
            обаждане или имейл с конкретна информация — наличност, цена и срок за
            доставка.
          </Text>
          <Text style={{ color: "#2A1414" }}>
            Ако имаш допълнителни въпроси междувременно, отговори на този имейл.
          </Text>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Text style={{ color: "#6B4848", fontStyle: "italic", fontSize: 14 }}>
            &bdquo;The best tunes are played on the oldest fiddles.&ldquo; — Ralph Waldo Emerson
          </Text>
          <Text style={{ color: "#6B4848", fontSize: 12 }}>
            Old Timer&apos;s — Части за класически автомобили
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderReceivedEmail;
