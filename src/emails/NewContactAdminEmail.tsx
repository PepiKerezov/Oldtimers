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

export function NewContactAdminEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  return (
    <Html lang="bg">
      <Head />
      <Preview>Ново съобщение от {name}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#F5EDE2" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ color: "#5C1A1B", margin: 0 }}>Ново съобщение</Heading>
          <Text style={{ color: "#2A1414" }}>
            <strong>{name}</strong> ({email}) ти изпрати съобщение:
          </Text>
          <Hr style={{ borderColor: "#E8DCCD" }} />
          <Text style={{ color: "#2A1414", whiteSpace: "pre-wrap" }}>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default NewContactAdminEmail;
