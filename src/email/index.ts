import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import fs from 'fs';
import path from 'path';

// 定义邮件配置接口（含附件）
interface EmailConfig {
  host: string;
  port: number;
  service: string;
  auth: {
    user: string;
    pass: string; // 126 邮箱的授权码
  };
}

// 创建传输器（使用 126 邮箱配置）
const createTransporter = (config: EmailConfig): Transporter => {
  return nodemailer.createTransport(config);
};

// 主函数：发送带附件的邮件
const main = async () => {
  // 1. 邮箱配置（替换为你的 126 邮箱信息）
  const emailConfig: EmailConfig = {
    host:  "smtp.163.com",   
    port: 465,   
    service: '163',
    auth: {
      user: 'acongmr@163.com', // 你的 126 邮箱
      pass: 'ARUGRWDHmGNa75Z9',       // 126 邮箱生成的授权码
    },
  };

  const transporter = createTransporter(emailConfig);

  // 2. 邮件内容配置（含附件）
  const mailOptions = {
    from: `"测试发送者" <${emailConfig.auth.user}>`,
    to: 'acongm@126.com', // 收件人邮箱
    subject: 'Nodemailer 带附件测试邮件',
    text: '这是一封包含附件的测试邮件！',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>邮件附件测试</h1>
        <p>附件包含：</p>
        <ul>
          <li>本地文件：example.pdf</li>
          <li>内存生成的文本文件：generated.txt</li>
          <li>嵌入正文的图片：<img src="cid:logo" width="100" /></li>
        </ul>
      </div>
    `,
    // 附件配置（关键！）
    attachments: [
      // 附件 1：本地文件（推荐使用 path 解析路径）
      {
        filename: 'example.docx', // 收件人看到的文件名
        path: path.join(__dirname, './example.docx'), // 本地文件路径
        contentType: 'application/docx', // 显式指定 MIME 类型（可选）
      },
      {
        filename: 'example2.docx', // 收件人看到的文件名
        path: path.join(__dirname, './example2.docx'), // 本地文件路径
        contentType: 'application/docx', // 显式指定 MIME 类型（可选）
      },

    ],
  };

  // 3. 发送邮件
  try {
    await transporter.verify(); // 验证配置
    const info = await transporter.sendMail(mailOptions);
    console.log('带附件邮件发送成功:', info.messageId);
  } catch (error) {
    console.error('邮件发送失败:', error);
  }
};

// 执行主函数
main()
  .then(() => console.log('演示完成'))
  .catch((err) => console.error('演示失败:', err));