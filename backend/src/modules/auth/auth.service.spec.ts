import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { LoginAttempt } from '../users/entities/login-attempt.entity';
import { OpenBaoService } from '../../core/openbao/openbao.service';

describe('AuthService - Seguridad Estricta y Fuerza Bruta', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockAttemptRepo: any;
  let mockOpenBaoService: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
    };
    mockAttemptRepo = {
      count: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn(),
    };
    mockOpenBaoService = {
      getAuthSecrets: vi.fn().mockResolvedValue({
        authKey: 'test_key',
        jwtKey: 'test_jwt_secret_32_bytes_long_key_123',
        sessionName: 'chifa_session',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(LoginAttempt), useValue: mockAttemptRepo },
        { provide: OpenBaoService, useValue: mockOpenBaoService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe bloquear con 429 si se superan 5 intentos fallidos en 5 minutos', async () => {
    mockAttemptRepo.count.mockResolvedValue(5);

    await expect(
      service.login(
        { username: 'admin', password: 'wrong_password', tenantId: 'chifa-mariana' },
        '127.0.0.1',
      ),
    ).rejects.toThrow(
      new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Demasiados intentos fallidos. Acceso bloqueado temporalmente por 5 minutos.',
          retryAfter: 300,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  it('debe rechazar con 401 y mensaje genérico si las credenciales son incorrectas', async () => {
    mockAttemptRepo.count.mockResolvedValue(0);
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(
      service.login(
        { username: 'no_existe', password: 'wrong_password', tenantId: 'chifa-mariana' },
        '127.0.0.1',
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockAttemptRepo.save).toHaveBeenCalled();
  });
});
