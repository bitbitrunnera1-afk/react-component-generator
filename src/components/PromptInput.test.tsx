import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  describe('500자 길이 제한', () => {
    it('500자 입력은 생성 버튼이 활성이고 onGenerate가 호출된다', async () => {
      const onGenerate = vi.fn();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(500) } });
      const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
      expect(submit).toBeEnabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await userEvent.click(submit);
      expect(onGenerate).toHaveBeenCalledWith('a'.repeat(500));
    });

    it('501자 입력은 생성 버튼을 비활성화하고 안내 문구를 보여준다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(501) } });

      expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent('500자 이하로 입력해주세요');
    });

    it('글자 수 카운터는 현재 길이와 최대 길이를 보여준다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(501) } });

      expect(screen.getByText('501 / 500')).toBeInTheDocument();
    });

    it('초과 상태에서 Ctrl+Enter로 제출해도 onGenerate가 호출되지 않는다', () => {
      const onGenerate = vi.fn();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      expect(onGenerate).not.toHaveBeenCalled();
    });
  });

  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('히스토리 항목을 누르면 입력창에 채워진다', async () => {
    const user = userEvent.setup();
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} history={['이전 프롬프트']} />);

    await user.click(screen.getByRole('button', { name: '이전 프롬프트' }));

    expect(screen.getByRole('textbox')).toHaveValue('이전 프롬프트');
  });

  it('히스토리가 비어 있으면 최근 프롬프트 영역을 보여주지 않는다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} history={[]} />);
    expect(screen.queryByText('최근 프롬프트')).not.toBeInTheDocument();
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });
});
