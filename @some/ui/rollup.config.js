import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';

export default {
  input: './src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  plugins: [
    typescript(),
    postcss(),
    commonjs(),
    nodeResolve()
  ]
};
