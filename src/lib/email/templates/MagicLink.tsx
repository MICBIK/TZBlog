import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  url: string;
  email: string;
  expiresInMinutes: number;
}

export function MagicLinkEmail({
  url,
  email,
  expiresInMinutes,
}: MagicLinkEmailProps) {
  return (
    <Html lang="zh">
      <Head />
      <Preview>登录 TZBlog 的一次性链接</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>登录 TZBlog</Heading>
          <Text style={textStyle}>你好，{email}</Text>
          <Text style={textStyle}>
            点击下方按钮完成登录。链接 {expiresInMinutes} 分钟内有效，且只能使用一次。
          </Text>
          <Button href={url} style={buttonStyle}>
            登录 TZBlog
          </Button>
          <Text style={mutedStyle}>
            如果不是你本人操作，请忽略此邮件。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
};

const headingStyle = {
  fontSize: "24px",
  lineHeight: "1.3",
  color: "#0f172a",
};

const textStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#334155",
};

const mutedStyle = {
  ...textStyle,
  color: "#64748b",
};

const buttonStyle = {
  display: "inline-block",
  padding: "12px 20px",
  borderRadius: "8px",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 600,
};
