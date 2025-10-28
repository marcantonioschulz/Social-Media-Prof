import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/entities/user.entity';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'user',
        ipAddress,
        userAgent,
        organizationId: 'system',
        metadata: { email: loginDto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Log successful login
    await this.auditService.log({
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string) {
    const user = await this.usersService.create(registerDto);

    await this.auditService.log({
      action: AuditAction.USER_CREATED,
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });

    return { message: 'User registered successfully', userId: user.id };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, organizationId: string, ipAddress: string, userAgent: string) {
    await this.auditService.log({
      action: AuditAction.LOGOUT,
      entityType: 'user',
      entityId: userId,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });

    return { message: 'Logged out successfully' };
  }
}
