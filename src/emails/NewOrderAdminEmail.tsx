import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: number;
  partDesc: string;
  notes?: string | null;
  adminUrl: string;
};

export function NewOrderAdminEmail({
  orderId,
  customerName,
  email,
  phone,
  carMake,
  carModel,
  carYear,
  partDesc,
  notes,
  adminUrl,
}: Props) {
  return (
    <Html lang="bg">
      <Head />
      <Preview>Нова заявка за част от {customerName}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#F5EDE2" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ color: "#5C1A1B", margin: 0 }}>Нова поръчка</Heading>
          <Text style={{ color: "#2A1414" }}>
            #{orderId} — постъпи нова заявка за част.
          </Text>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Section>
            <Field label="Клиент" value={customerName} />
            <Field label="Имейл" value={email} />
            <Field label="Телефон" value={phone} />
          </Section>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Section>
            <Field label="Автомобил" value={`${carMake} ${carModel} (${carYear})`} />
            <Field label="Описание на частта" value={partDesc} />
            {notes && <Field label="Бележки" value={notes} />}
          </Section>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Link
            href={adminUrl}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              backgroundColor: "#5C1A1B",
              color: "#F5EDE2",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Виж в админ панела
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: "8px 0", color: "#2A1414" }}>
      <strong style={{ color: "#6B4848" }}>{label}: </strong>
      {value}
    </Text>
  );
}

export default NewOrderAdminEmail;
