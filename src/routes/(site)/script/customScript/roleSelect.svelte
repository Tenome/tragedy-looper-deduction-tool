<script lang="ts">
  import { derived } from 'svelte/store';
  import type { CharacterName } from '../../../../model/characters';
  import type { ICustomScriptRoleExclusiveSelection } from '../../../../model/customScript';
  import Option from './option.svelte';
  import { getString } from '../../+layout.svelte';

  export let role: ICustomScriptRoleExclusiveSelection<CharacterName>;
  $: selectedCharacter = role.selectedCharacter;
  $: availableCharacters = derived(role.availableCharacters, (a) => {
    return a.toSorted((a, b) => {
      return a.localeCompare(b);
    });
  });

  $: options = role.options;
</script>

<select bind:value={$selectedCharacter}>
  <option value="" disabled selected>{$getString('Select a character')}</option>
  {#each $availableCharacters as c}
    <option value={c}>{c}</option>
  {/each}
</select>
{#each $options as option}
  <Option {option} />
{/each}
<hr />
