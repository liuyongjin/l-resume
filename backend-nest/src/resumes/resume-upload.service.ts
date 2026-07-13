import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx'];
const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export interface ResumeFileSaveResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url?: string;
}

export interface AvatarUploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface ResumeFileParseResult extends ResumeFileSaveResult {
  textContent: string;
  resumeData: Record<string, unknown>;
}

@Injectable()
export class ResumeUploadService {
  private getUploadRoot() {
    return join(process.cwd(), 'uploads');
  }

  /** Multer 将 UTF-8 文件名按 latin1 解析，需还原 */
  private decodeFileName(originalname: string): string {
    if (!originalname) return originalname;
    try {
      const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
      return decoded.includes('\uFFFD') ? originalname : decoded;
    } catch {
      return originalname;
    }
  }

  validateFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请选择要上传的文件' },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '文件大小不能超过 5MB' },
      });
    }

    const ext = extname(this.decodeFileName(file.originalname)).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '仅支持 PDF、DOC、DOCX、TXT、MD 格式' },
      });
    }

    return file;
  }

  validateAvatarFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请选择要上传的头像图片' },
      });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '头像图片大小不能超过 2MB' },
      });
    }

    const ext = extname(this.decodeFileName(file.originalname)).toLowerCase();
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(ext)) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '仅支持 JPG、PNG、WEBP、GIF 格式头像' },
      });
    }

    return file;
  }

  async saveAvatarFile(userId: number, file: Express.Multer.File): Promise<AvatarUploadResult> {
    const fileName = this.decodeFileName(file.originalname);
    const ext = extname(fileName).toLowerCase();
    const storageKey = `avatars/${userId}/${randomUUID()}${ext}`;
    const absolutePath = join(this.getUploadRoot(), storageKey);

    await mkdir(join(this.getUploadRoot(), `avatars/${userId}`), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const url = `/api/uploads/${storageKey}`;

    return {
      filePath: storageKey,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      url,
    };
  }

  /** 保存上传文件，仅返回存储路径，不在上传阶段解析内容 */
  async saveUploadedFile(
    userId: number,
    file: Express.Multer.File,
    overrideFileName?: string,
  ): Promise<ResumeFileSaveResult> {
    const fileName = overrideFileName?.trim() || this.decodeFileName(file.originalname);
    const ext = extname(fileName).toLowerCase();
    const storageKey = `resumes/${userId}/${randomUUID()}${ext}`;
    const absolutePath = join(this.getUploadRoot(), storageKey);

    await mkdir(join(this.getUploadRoot(), `resumes/${userId}`), { recursive: true });
    await writeFile(absolutePath, file.buffer);
    await writeFile(
      `${absolutePath}.meta.json`,
      JSON.stringify({ fileName, uploadedAt: new Date().toISOString() }),
      'utf-8',
    );

    return {
      filePath: storageKey,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };
  }

  /** 执行阶段：根据存储路径读取并解析为 resumeData */
  async loadAndParseFromPath(
    userId: number,
    filePath: string,
    originalFileName?: string,
  ): Promise<ResumeFileParseResult> {
    const absolutePath = this.resolveUserFilePath(userId, filePath);
    const buffer = await readFile(absolutePath);
    const fileName = await this.resolveOriginalFileName(absolutePath, originalFileName);
    const ext = extname(fileName).toLowerCase();
    const textContent = await this.extractText(buffer, ext);

    if (!textContent.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '无法从文件中提取文本内容，请尝试 TXT 或 MD 格式' },
      });
    }

    return {
      filePath,
      fileName,
      fileSize: buffer.length,
      mimeType: this.guessMimeType(ext),
      uploadedAt: new Date().toISOString(),
      textContent,
      resumeData: this.buildResumeData(textContent),
    };
  }

  private async resolveOriginalFileName(
    absolutePath: string,
    overrideFileName?: string,
  ): Promise<string> {
    if (overrideFileName?.trim()) {
      return overrideFileName.trim();
    }

    try {
      const metaRaw = await readFile(`${absolutePath}.meta.json`, 'utf-8');
      const meta = JSON.parse(metaRaw) as { fileName?: string };
      if (typeof meta.fileName === 'string' && meta.fileName.trim()) {
        return meta.fileName.trim();
      }
    } catch {
      // 无元数据时回退到存储文件名
    }

    return absolutePath.split(/[/\\]/).pop() || 'resume';
  }

  private resolveUserFilePath(userId: number, filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const expectedPrefix = `resumes/${userId}/`;

    if (!normalized.startsWith(expectedPrefix)) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '无效的文件路径' },
      });
    }

    const absolutePath = join(this.getUploadRoot(), normalized);
    const userRoot = join(this.getUploadRoot(), `resumes/${userId}`);

    if (!absolutePath.startsWith(userRoot)) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '无效的文件路径' },
      });
    }

    return absolutePath;
  }

  private guessMimeType(ext: string): string {
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.txt':
        return 'text/plain';
      case '.md':
        return 'text/markdown';
      default:
        return 'application/octet-stream';
    }
  }

  private async extractText(buffer: Buffer, ext: string): Promise<string> {
    if (ext === '.txt' || ext === '.md') {
      return buffer.toString('utf-8');
    }

    if (ext === '.pdf') {
      return this.extractPdfText(buffer);
    }

    if (ext === '.docx') {
      return this.extractDocxText(buffer);
    }

    if (ext === '.doc') {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '暂不支持 .doc 格式，请转换为 DOCX、TXT 或 MD 后上传' },
      });
    }

    return '';
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text || '';
    } catch {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: 'PDF 解析失败，请尝试 TXT 或 MD 格式' },
      });
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: 'DOCX 解析失败，请尝试 TXT 或 MD 格式' },
      });
    }
  }

  buildResumeData(textContent: string): Record<string, unknown> {
    return {
      basicInfo: {
        name: '',
        position: '',
        phone: '',
        email: '',
        city: '',
        avatar: '',
        showAvatar: true,
      },
      professionalSummary: '',
      rawText: textContent,
      workExperience: [],
      education: [],
      projectExperience: [],
      skills: [{ id: 'skill1', category: '专业技能', items: [] }],
      certificates: [],
      openSourceProject: [],
      github: [],
    };
  }
}
